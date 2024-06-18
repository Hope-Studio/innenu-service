import type { RichTextNode } from "@mptool/parser";
import { getRichTextNodes } from "@mptool/parser";
import type { RequestHandler } from "express";

import { OFFICIAL_URL, getOfficialPageView } from "./utils.js";
import { MissingArgResponse, UnknownResponse } from "../config/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
  EmptyObject,
} from "../typings.js";

const INFO_REGEXP =
  /<div class="ar_tit">\s*<h3>([^>]+)<\/h3>\s*<h6>([^]+?)<\/h6>/;
const CONTENT_REGEXP =
  /<div class="v_news_content">([^]+?)<\/div><\/div><div id="div_vote_id">/;

const TIME_REGEXP = /<span>发布时间：([^<]*)<\/span>/;
const FROM_REGEXP = /<span>供稿单位：([^<]*)<\/span>/;
const AUTHOR_REGEXP = /<span>撰稿：([^<]*)<\/span>/;
const EDITOR_REGEXP = /<span>网络编辑：<em>([^<]+?)<\/em><\/span>/;
const PAGEVIEW_PARAMS_REGEXP = /_showDynClicks\("wbnews",\s*(\d+),\s*(\d+)\)/;

export interface OfficialInfoDetailOptions {
  url: string;
}

export interface OfficialInfoData {
  /** 标题 */
  title: string;
  /** 时间 */
  time: string;
  /** 浏览量 */
  pageView: number;
  /** 发布单位 */
  from?: string;
  /** 作者 */
  author?: string;
  /** 编辑 */
  editor?: string;
  /** 内容 */
  content: RichTextNode[];
}

export type OfficialInfoDetailSuccessResponse =
  CommonSuccessResponse<OfficialInfoData>;

export type OfficialInfoDetailResponse =
  | OfficialInfoDetailSuccessResponse
  | CommonFailedResponse;

export const officialInfoDetailHandler: RequestHandler<
  EmptyObject,
  EmptyObject,
  EmptyObject,
  OfficialInfoDetailOptions
> = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) return res.json(MissingArgResponse("url"));

    const response = await fetch(`${OFFICIAL_URL}/${url}`);

    if (response.status !== 200) throw new Error("请求失败");

    const text = await response.text();

    const [, title, info] = INFO_REGEXP.exec(text)!;

    const time = TIME_REGEXP.exec(info)![1];
    const from = FROM_REGEXP.exec(info)?.[1];
    const author = AUTHOR_REGEXP.exec(info)?.[1];
    const editor = EDITOR_REGEXP.exec(info)?.[1];
    const [, owner, id] = PAGEVIEW_PARAMS_REGEXP.exec(info)!;
    const content = CONTENT_REGEXP.exec(text)![1];

    const data = {
      title,
      time,
      from,
      author,
      editor,
      pageView: await getOfficialPageView(id, owner),
      content: await getRichTextNodes(content, {
        transform: {
          img: (node) => {
            const src = node.attrs?.src;

            if (src) {
              if (src.includes("/fileTypeImages/")) return null;

              if (src.startsWith("/"))
                node.attrs!.src = `${OFFICIAL_URL}${src}`;
            }

            return node;
          },
          td: (node) => {
            delete node.attrs?.style;

            return node;
          },
        },
      }),
    };

    return res.json({
      success: true,
      data,
    } as OfficialInfoDetailResponse);
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return res.json(UnknownResponse(message));
  }
};
