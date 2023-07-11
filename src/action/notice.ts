import type { RequestHandler } from "express";
import type { Cookie } from "set-cookie-parser";

import { actionLogin } from "./login.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import type {
  CommonFailedResponse,
  CookieOptions,
  EmptyObject,
  LoginOptions,
} from "../typings.js";
import { getCookieHeader } from "../utils/index.js";

export type NoticeOptions = (LoginOptions | CookieOptions) & {
  noticeID: string;
};

const titleRegExp = /var title = '(.*?)';/;
const fromRegExp = /var ly = '(.*?)'/;
const authorRegExp = /var wz = '(.*?)'/;
const pageViewRegExp =
  /<span style="margin: 0 10px;font-size: 13px;color: #787878;font-family: 'Microsoft YaHei';">\s+阅览：(\d+)\s+<\/span>/;
const contentRegExp =
  /<div class="read" id="WBNR">\s+([\s\S]*?)\s+<\/div>\s+<p id="zrbj"/;

export interface NoticeSuccessResponse {
  status: "success";
  title: string;
  author: string;
  from: string;
  pageView: number;
  content: string;
}

export type NoticeResponse = NoticeSuccessResponse | CommonFailedResponse;

export const noticeHandler: RequestHandler<
  EmptyObject,
  EmptyObject,
  NoticeOptions
> = async (req, res) => {
  try {
    const { noticeID } = req.body;

    if (!noticeID)
      return res.json({
        status: "failed",
        msg: "ID is required",
      });

    let cookies: Cookie[] = [];

    if ("cookies" in req.body) {
      ({ cookies } = req.body);
    } else {
      const result = await actionLogin(req.body);

      if (result.status === "failed") return res.json(result);

      ({ cookies } = result);
    }

    const response = await fetch(
      `https://m-443.webvpn.nenu.edu.cn/page/viewNews?ID=${noticeID}`,
      {
        headers: {
          Cookie: getCookieHeader(cookies),
        },
      },
    );

    console.log(response.status);

    const responseText = await response.text();

    const title = titleRegExp.exec(responseText)![1];
    const author = authorRegExp.exec(responseText)![1];
    const from = fromRegExp.exec(responseText)![1];
    const pageView = pageViewRegExp.exec(responseText)![1];
    const content = contentRegExp.exec(responseText)![1];

    return res.json(<NoticeSuccessResponse>{
      status: "success",
      title,
      author,
      from,
      pageView: Number(pageView),
      content,
    });
  } catch (err) {
    const { message } = <Error>err;

    console.error(err);
    res.json(<AuthLoginFailedResponse>{
      status: "failed",
      msg: message,
    });
  }
};
