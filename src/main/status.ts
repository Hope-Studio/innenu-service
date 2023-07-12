import type { RequestHandler } from "express";

import type { CommonFailedResponse } from "../typings.js";
import type { Node } from "../utils/index.js";
import { getRichTextNodes } from "../utils/index.js";

const contentRegExp = /<div id="vsb_content">([\s\S]+?)<\/div>/;

export interface MainStatusSuccessResponse {
  success: true;
  /** @deprecated */
  status: "success";
  data: Node[];
}

export type MainStatusResponse =
  | MainStatusSuccessResponse
  | CommonFailedResponse;

export const mainStatusHandler: RequestHandler = async (_, res) => {
  try {
    const response = await fetch("https://www.nenu.edu.cn/xxgk1/xqtj1.htm");

    if (response.status !== 200)
      return res.json(<CommonFailedResponse>{
        success: false,
        status: "failed",
        msg: "请求失败",
      });

    const text = await response.text();

    return res.json(<MainStatusSuccessResponse>{
      success: true,
      status: "success",
      data: await getRichTextNodes(contentRegExp.exec(text)![1].trim()),
    });
  } catch (err) {
    const { message } = <Error>err;

    console.error(err);
    res.json(<CommonFailedResponse>{
      success: false,
      status: "failed",
      msg: message,
    });
  }
};