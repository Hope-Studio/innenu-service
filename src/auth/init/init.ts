import { CookieStore } from "@mptool/net";
import { v7 } from "uuid";

import { authCenterLogin, getAvatar } from "../../auth-center/index.js";
import { INFO_PREFIX } from "../../auth-center/utils.js";
import {
  ActionFailType,
  TEST_COOKIE_STORE,
  TEST_INFO,
  UnknownResponse,
  WrongPasswordResponse,
} from "../../config/index.js";
import type { MyInfo } from "../../my/index.js";
import { getMyInfo, myLogin } from "../../my/index.js";
import { MY_SERVER } from "../../my/utils.js";
import type { AccountInfo, CommonFailedResponse } from "../../typings.js";
import { BLACKLIST_HINT, connect, isInBlackList } from "../../utils/index.js";
import { vpnLogin } from "../../vpn/login.js";
import { authEncrypt } from "../encrypt.js";
import {
  AUTH_LOGIN_URL,
  IMPROVE_INFO_URL,
  RE_AUTH_URL,
  UPDATE_INFO_URL,
} from "../utils.js";

export interface InitAuthOptions extends AccountInfo {
  /** 选项 */
  params: Record<string, string>;
  /** 盐值 */
  salt: string;
  /** 用户 OpenID */
  openid: string;
}

export interface InitAuthSuccessResult {
  success: true;
  info: (MyInfo & { avatar: string }) | null;
  cookieStore: CookieStore;
}

export type InitAuthFailedResponse =
  | CommonFailedResponse<
      | ActionFailType.AccountLocked
      | ActionFailType.BlackList
      | ActionFailType.EnabledSSO
      | ActionFailType.Expired
      | ActionFailType.NeedCaptcha
      | ActionFailType.Unknown
      | ActionFailType.WeekPassword
      | ActionFailType.WrongCaptcha
      | ActionFailType.WrongPassword
    >
  | (CommonFailedResponse<ActionFailType.NeedReAuth> & {
      cookieStore: CookieStore;
    });

export type InitAuthResult = InitAuthSuccessResult | InitAuthFailedResponse;

export const TEST_AUTH_INIT: InitAuthSuccessResult = {
  success: true,
  info: TEST_INFO,
  cookieStore: TEST_COOKIE_STORE,
};

export const initAuth = async (
  { id, password, authToken, salt, params, openid }: InitAuthOptions,
  cookieHeader: string,
): Promise<InitAuthResult> => {
  const cookieStore = new CookieStore();
  const loginResponse = await fetch(AUTH_LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader,
      Referer: AUTH_LOGIN_URL,
      "User-Agent": "inNENU service",
    },
    body: new URLSearchParams({
      ...params,
      password: authEncrypt(password, salt),
    }),
    redirect: "manual",
  });

  cookieStore.applyResponse(loginResponse, AUTH_LOGIN_URL);

  const location = loginResponse.headers.get("Location");
  const resultContent = await loginResponse.text();

  if (loginResponse.status === 401) {
    if (resultContent.includes("您提供的用户名或者密码有误"))
      return WrongPasswordResponse;

    const lockedResult = /<span>账号已冻结，预计解冻时间：(.*?)<\/span>/.exec(
      resultContent,
    );

    if (lockedResult)
      return {
        success: false,
        type: ActionFailType.AccountLocked,
        msg: `账号已冻结，预计解冻时间：${lockedResult[1]}`,
      };

    console.error(
      "Unknown login response: ",
      loginResponse.status,
      resultContent,
    );

    return UnknownResponse("未知错误");
  }

  if (loginResponse.status === 200) {
    if (resultContent.includes("无效的验证码"))
      return {
        success: false,
        type: ActionFailType.WrongCaptcha,
        msg: "验证码错误",
      };

    if (resultContent.includes("您提供的用户名或者密码有误"))
      return WrongPasswordResponse;

    if (resultContent.includes("会话已失效，请刷新页面再登录"))
      return {
        success: false,
        type: ActionFailType.Expired,
        msg: "会话已过期，请重新登陆",
      };

    if (
      resultContent.includes(
        "当前存在其他用户使用同一帐号登录，是否注销其他使用同一帐号的用户。",
      )
    )
      return {
        success: false,
        type: ActionFailType.EnabledSSO,
        msg: "您已开启单点登录，请访问学校统一身份认证官网，在个人设置中关闭单点登录后重试。",
      };

    if (resultContent.includes("<span>请输入验证码</span>"))
      return {
        success: false,
        type: ActionFailType.NeedCaptcha,
        msg: "需要验证码",
      };
  }

  if (loginResponse.status === 302) {
    if (location?.startsWith(AUTH_LOGIN_URL)) return WrongPasswordResponse;

    if (location?.startsWith(IMPROVE_INFO_URL)) {
      const response = await fetch(UPDATE_INFO_URL, {
        method: "POST",
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          Cookie: cookieHeader + ";" + cookieStore.getHeader(UPDATE_INFO_URL),
          "User-Agent": "inNENU",
        },
      });

      const result = (await response.json()) as { errMsg: string };

      return {
        success: false,
        type: ActionFailType.WeekPassword,
        msg: result.errMsg ?? "密码太弱，请手动修改密码",
      };
    }

    if (location?.startsWith(RE_AUTH_URL))
      return {
        success: false,
        type: ActionFailType.NeedReAuth,
        msg: "需要二次认证",
        cookieStore,
      };

    let info: (MyInfo & { avatar: string }) | null = null;

    let loginResult = await myLogin({ id, password, authToken }, cookieStore);

    if (
      "type" in loginResult &&
      loginResult.type === ActionFailType.Forbidden
    ) {
      // Activate VPN by login
      const vpnLoginResult = await vpnLogin(
        { id, password, authToken },
        cookieStore,
      );

      if (vpnLoginResult.success)
        loginResult = await myLogin({ id, password, authToken }, cookieStore);
      else console.error("VPN login failed", vpnLoginResult);
    }

    // 获得信息
    if (loginResult.success) {
      const studentInfo = await getMyInfo(cookieStore.getHeader(MY_SERVER));

      if (studentInfo.success) {
        const { connection, release } = await connect();

        let avatar = "";

        const authCenterResult = await authCenterLogin(
          { id, password, authToken },
          cookieStore,
        );

        if (authCenterResult.success) {
          const avatarInfo = await getAvatar(
            cookieStore.getHeader(INFO_PREFIX),
          );

          if (avatarInfo.success) {
            avatar = avatarInfo.data.avatar;
            await connection.execute(
              `REPLACE INTO student_avatar (id, avatar) VALUES (?, ?);`,
              [id, avatar],
            );
          }
        }

        info = {
          avatar,
          ...studentInfo.data,
        };

        await connection.execute(
          `REPLACE INTO student_info (id, uuid, name, org, orgId, major, majorId, inYear, grade, type, typeId, code, politicalStatus, people, peopleId, gender, genderId, birth, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            info.id,
            v7(),
            info.name,
            info.org,
            info.orgId,
            info.major,
            info.majorId,
            info.inYear,
            info.grade,
            info.type,
            info.typeId,
            info.code,
            info.politicalStatus,
            info.people,
            info.peopleId,
            info.gender,
            info.genderId,
            info.birth,
            info.location,
          ],
        );

        release();
      }
    }

    if (isInBlackList(id, openid, info))
      return {
        success: false,
        type: ActionFailType.BlackList,
        msg: BLACKLIST_HINT[Math.floor(Math.random() * BLACKLIST_HINT.length)],
      };

    return {
      success: true,
      info,
      cookieStore,
    };
  }

  console.error(
    "Unknown login response: ",
    loginResponse.status,
    resultContent,
  );

  return UnknownResponse("登录失败");
};