import type { RequestHandler } from "express";
import type { Cookie } from "set-cookie-parser";

import { login } from "./login.js";
import type { EmptyObject, LoginOptions } from "../typings.js";
import { getCookieHeader } from "../utils/cookie.js";

export interface InfoSuccessResponse {
  status: "success";

  /** 用户姓名 */
  name: string;

  /** 用户邮箱 */
  email: string;
}

export interface InfoFailedResponse {
  status: "failed";
  msg: string;
}

export type InfoResponse = InfoSuccessResponse | InfoFailedResponse;

const userNameRegexp =
  /class="auth_username">\s+<span>\s+<span>\s+(.*?)\s+<\/span>/;

const inputRegExp = /id="alias".*?value="(.*?)"/;

export const getInfo = async (cookies: Cookie[]): Promise<InfoResponse> => {
  const userNameResponse = await fetch(
    "https://authserver.nenu.edu.cn/authserver/index.do",
    {
      method: "GET",
      headers: {
        Cookie: getCookieHeader(cookies),
      },
    }
  );

  const userNameResponseText = await userNameResponse.text();

  const userName = userNameRegexp.exec(userNameResponseText)?.[1];

  console.log("Getting username", userName);

  if (!userName)
    return <InfoFailedResponse>{
      status: "failed",
      msg: "获取姓名失败",
    };

  const emailResponse = await fetch(
    "https://authserver.nenu.edu.cn/authserver/userAttributesEdit.do",
    {
      method: "GET",
      headers: {
        Cookie: getCookieHeader(cookies),
      },
    }
  );

  const emailResponseText = await emailResponse.text();

  const emailName = inputRegExp.exec(emailResponseText)?.[1];

  console.log("Getting email name", emailName);

  if (typeof emailName !== "string")
    return <InfoFailedResponse>{
      status: "failed",
      msg: "获取邮箱失败",
    };

  return <InfoSuccessResponse>{
    status: "success",
    name: userName,
    email: emailName ? `${emailName}@nenu.edu.cn` : "未设置邮箱",
  };
};

export const infoHandler: RequestHandler<
  EmptyObject,
  EmptyObject,
  LoginOptions | { cookies: Cookie[] }
> = async (req, res) => {
  try {
    if ("cookies" in req.body) return res.json(await getInfo(req.body.cookies));

    const result = await login(req.body);

    if (result.status === "success")
      return res.json(await getInfo(result.cookies));

    return res.json(<InfoResponse>{
      status: "failed",
      msg: "登录失败",
    });
  } catch (err) {
    return res.json(<InfoFailedResponse>{ status: "failed", msg: "参数错误" });
  }
};
