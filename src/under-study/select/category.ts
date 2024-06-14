import type { RequestHandler } from "express";

import type { AuthLoginFailedResult } from "../../auth/index.js";
import type {
  CommonFailedResponse,
  EmptyObject,
  LoginOptions,
} from "../../typings.js";
import { EDGE_USER_AGENT_HEADERS } from "../../utils/index.js";
import { underStudyLogin } from "../login.js";
import { UNDER_STUDY_SERVER } from "../utils.js";

export interface UnderSelectCategoryItem {
  term: string;
  stage: string;
  canRemove: boolean;
  name: string;
  link: string;
  startTime: string;
  endTime: string;
}

export interface UnderSelectCategorySuccessResponse {
  success: true;
  data: UnderSelectCategoryItem[];
}

export type UnderSelectCategoryResponse =
  | UnderSelectCategorySuccessResponse
  | AuthLoginFailedResult
  | (CommonFailedResponse & { type: "not-initialized" });

const CATEGORY_PAGE = `${UNDER_STUDY_SERVER}/new/student/xsxk/`;

const CATEGORY_ITEM_REGEXP =
  /<div id="bb2"[^]+?lay-tips="选课学期:([^]*?)\s+<br>现在是([^]*?)阶段\s+<br>([^]*?)\s+"\s+lay-iframe="(.*?)"\s+data-href="(.*?)">[^]+?<div class="description">([^]+?)<br>([^]+?)<br><\/div>/g;

const getSelectCategories = (content: string): UnderSelectCategoryItem[] =>
  Array.from(content.matchAll(CATEGORY_ITEM_REGEXP)).map(
    ([, term, stage, canRemoveText, name, link, startTime, endTime]) => ({
      term,
      stage,
      canRemove: canRemoveText === "可退选",
      name,
      link,
      startTime,
      endTime,
    }),
  );

export const underStudySelectCategoryHandler: RequestHandler<
  EmptyObject,
  EmptyObject,
  Partial<LoginOptions>
> = async (req, res) => {
  try {
    let cookieHeader = req.headers.cookie;

    if (!cookieHeader) {
      if (!req.body.id || !req.body.password)
        return res.json({
          success: false,
          msg: "请提供账号密码",
        } as CommonFailedResponse);

      const result = await underStudyLogin(req.body as LoginOptions);

      if (!result.success) return res.json(result);
      cookieHeader = result.cookieStore.getHeader(CATEGORY_PAGE);
    }

    const response = await fetch(CATEGORY_PAGE, {
      headers: {
        Cookie: cookieHeader,
        Referer: `${UNDER_STUDY_SERVER}/new/welcome.page?ui=new`,
        ...EDGE_USER_AGENT_HEADERS,
      },
    });

    const content = await response.text();

    if (content.includes("选课正在初始化")) {
      return res.json({
        success: false,
        msg: "选课正在初始化，请稍后再试",
        type: "not-initialized",
      } as CommonFailedResponse);
    }

    return res.json({
      success: true,
      data: getSelectCategories(content),
    } as UnderSelectCategorySuccessResponse);
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return res.json({
      success: false,
      msg: message,
    } as AuthLoginFailedResult);
  }
};
