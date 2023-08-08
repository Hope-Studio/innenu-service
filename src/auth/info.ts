import type { RequestHandler } from "express";

import { authLogin } from "./login.js";
import { AUTH_SERVER } from "./utils.js";
import type {
  CommonFailedResponse,
  CookieType,
  EmptyObject,
  LoginOptions,
} from "../typings.js";
import { cookies2Header } from "../utils/index.js";

export interface InfoSuccessResponse {
  success: true;

  /** 用户姓名 */
  name: string;

  /** 登陆别名 */
  alias: string;

  /**
   * 用户邮箱
   * @deprecated
   */
  email: string;
}

export type InfoResponse = InfoSuccessResponse | CommonFailedResponse;

const userNameRegexp =
  /class="auth_username">\s+<span>\s+<span>\s+(.*?)\s+<\/span>/;

const inputRegExp = /id="alias".*?value="(.*?)"/;

export const getBasicInfo = async (
  cookieHeader: string,
): Promise<InfoResponse> => {
  const userNameResponse = await fetch(`${AUTH_SERVER}/authserver/index.do`, {
    method: "GET",
    headers: {
      Cookie: cookieHeader,
    },
  });

  const userNameResponseText = await userNameResponse.text();

  const userName = userNameRegexp.exec(userNameResponseText)?.[1];

  console.log("Getting username", userName);

  if (!userName)
    return <CommonFailedResponse>{
      success: false,
      msg: "获取姓名失败",
    };

  const aliasResponse = await fetch(
    `${AUTH_SERVER}/authserver/userAttributesEdit.do`,
    {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
    },
  );

  const aliasResponseText = await aliasResponse.text();

  const alias = inputRegExp.exec(aliasResponseText)?.[1];

  console.log("Getting alias: ", alias);

  if (typeof alias !== "string")
    return <CommonFailedResponse>{
      success: false,
      msg: "获取别名失败",
    };

  return <InfoSuccessResponse>{
    success: true,
    name: userName,
    alias: alias || "未设置别名",
    // TODO: Get real email
    email: alias ? `${alias}@nenu.edu.cn` : "未设置邮箱",
  };
};

export const infoHandler: RequestHandler<
  EmptyObject,
  EmptyObject,
  LoginOptions | { cookies: CookieType[] }
> = async (req, res) => {
  try {
    if (req.headers.cookie)
      return res.json(await getBasicInfo(req.headers.cookie));

    if ("cookies" in req.body)
      return res.json(await getBasicInfo(cookies2Header(req.body.cookies)));

    const result = await authLogin(req.body);

    if (result.success)
      return res.json(
        await getBasicInfo(
          result.cookieStore.getHeader(`${AUTH_SERVER}/authserver/`),
        ),
      );

    return res.json(<CommonFailedResponse>{
      success: false,
      msg: "登录失败，无法获取信息。",
    });
  } catch (err) {
    const { message } = <Error>err;

    console.error(err);

    return res.json(<CommonFailedResponse>{
      success: false,
      msg: message,
    });
  }
};
