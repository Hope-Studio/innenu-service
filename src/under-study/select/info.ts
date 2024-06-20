import type { RequestHandler } from "express";

import type { SelectOptionConfig } from "./store.js";
import { areasStore, majorsStore, officesStore, typesStore } from "./store.js";
import type { AuthLoginFailedResponse } from "../../auth/index.js";
import {
  ActionFailType,
  ExpiredResponse,
  MissingArgResponse,
  MissingCredentialResponse,
  UnknownResponse,
} from "../../config/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
  EmptyObject,
  LoginOptions,
} from "../../typings.js";
import { EDGE_USER_AGENT_HEADERS } from "../../utils/index.js";
import { underStudyLogin } from "../login.js";
import { UNDER_STUDY_SERVER } from "../utils.js";

const CHECK_URL = `${UNDER_STUDY_SERVER}/new/student/xsxk/checkFinishPj`;

export interface UnderSelectInfoOptions extends LoginOptions {
  link: string;
}

export interface UnderSelectInfo {
  /** 学期 */
  term: string;
  /** 选课名称 */
  name: string;
  /** 是否可退选 */
  canCancel: boolean;
  /** 选课阶段 */
  stage: string;
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;

  /** 可用年级 */
  grades: number[];
  /** 可用校区 */
  areas: SelectOptionConfig[];
  /** 可用专业 */
  majors: SelectOptionConfig[];
  /** 可用开课单位 */
  offices: SelectOptionConfig[];
  /** 可用课程类别 */
  types: SelectOptionConfig[];

  /** 当前校区 */
  currentArea: string;
  /** 当前专业 */
  currentMajor: string;
  /** 当前年级 */
  currentGrade: number;
}

export type UnderSelectInfoSuccessResponse =
  CommonSuccessResponse<UnderSelectInfo>;

export type UnderSelectInfoResponse =
  | UnderSelectInfoSuccessResponse
  | AuthLoginFailedResponse
  | CommonFailedResponse<
      | ActionFailType.NotInitialized
      | ActionFailType.MissingCredential
      | ActionFailType.MissingCommentary
      | ActionFailType.MissingArg
      | ActionFailType.Unknown
    >;

const COURSE_OFFICES_REGEXP =
  /<select id='kkyxdm' name='kkyxdm'.*?><option value=''>\(请选择\)<\/option>(.*?)<\/select>/;
const COURSE_OFFICE_ITEM_REGEXP = /<option value='(.+?)' >\d+-(.*?)<\/option>/g;
const AREAS_REGEXP =
  /<select id='xqdm' name='xqdm'.*?><option value=''>\(请选择\)<\/option>(.*?)<\/select>/;
const AREA_ITEM_REGEXP = /<option value='(.+?)' >\d+-(.*?)<\/option>/g;
const COURSE_TYPES_REGEXP =
  /<select id='kcdldm' name='kcdldm'.*?><option value=''>\(请选择\)<\/option>(.*?)<\/select>/;
const COURSE_TYPE_ITEM_REGEXP = /<option value='(.+?)' >(.*?)<\/option>/g;
const CURRENT_GRADE_REGEXP = /<option value='(\d+)' selected>\1<\/option>/;
const MAJORS_REGEXP =
  /<select id='zydm' name='zydm'.*?><option value=''>\(全部\)<\/option>(.*?)<\/select>/;
const MAJOR_ITEM_REGEXP =
  /<option value='(\d+?)' (?:selected)?>\d+-(.*?)<\/option>/g;
const CURRENT_MAJOR_REGEXP =
  /<option value='(\d{6,7})' selected>\d+-(.*?)<\/option>/g;
const INFO_REGEXP =
  /<span id="title">(.*?)学期&nbsp;&nbsp;(.*?)&nbsp;&nbsp;<span.*?>(.*?)<\/span><\/span>\s+?<br>\s+?<span id="sub-title">\s+?<div id="text">现在是(.*?)时间\s+（(\d\d:\d\d:\d\d)--(\d\d:\d\d:\d\d)）/;

const setMajors = (content: string): void => {
  if (!majorsStore.state.length) {
    const majorText = content.match(MAJORS_REGEXP)![1];

    const majors = Array.from(majorText.matchAll(MAJOR_ITEM_REGEXP)).map(
      ([, value, name]) => ({
        value,
        name,
      }),
    );

    majorsStore.setState(majors);
  }
};

const setCourseOffices = (content: string): void => {
  if (!officesStore.state.length) {
    const courseOfficeText = content.match(COURSE_OFFICES_REGEXP)![1];

    const offices = Array.from(
      courseOfficeText.matchAll(COURSE_OFFICE_ITEM_REGEXP),
    ).map(([, value, name]) => ({
      value,
      name,
    }));

    officesStore.setState(offices);
  }
};

const setCourseTypes = (content: string): void => {
  if (!typesStore.state.length) {
    const courseTypeText = content.match(COURSE_TYPES_REGEXP)![1];

    const types = Array.from(
      courseTypeText.matchAll(COURSE_TYPE_ITEM_REGEXP),
    ).map(([, value, name]) => ({
      value,
      name,
    }));

    typesStore.setState(types);
  }
};

const setAreas = (content: string): void => {
  if (!areasStore.state.length) {
    const areaText = content.match(AREAS_REGEXP)![1];

    const areas = Array.from(areaText.matchAll(AREA_ITEM_REGEXP)).map(
      ([, value, name]) => ({
        value,
        name,
      }),
    );

    areasStore.setState(areas);
  }
};

const getSelectInfo = (content: string): UnderSelectInfo => {
  const [, term, name, canCancelText, stage, startTime, endTime] =
    content.match(INFO_REGEXP)!;

  const currentGrade = Number(content.match(CURRENT_GRADE_REGEXP)![1]);
  const currentMajor = content.match(CURRENT_MAJOR_REGEXP)![1];

  const currentYear = new Date().getFullYear();
  const grades = Array(6)
    .fill(null)
    .map((_, i) => currentYear - i);

  setAreas(content);
  setCourseOffices(content);
  setCourseTypes(content);
  setMajors(content);

  return {
    term,
    name,
    canCancel: canCancelText === "可退选",
    stage,
    startTime,
    endTime,

    grades,
    majors: majorsStore.state,
    areas: areasStore.state,
    offices: officesStore.state,
    types: typesStore.state,

    currentArea: name.includes("本部")
      ? "本部"
      : name.includes("净月")
        ? "净月"
        : "",
    currentGrade,
    currentMajor,
  };
};

const checkCourseCommentary = async (
  cookieHeader: string,
  term: string,
  categoryUrl: string,
): Promise<{ completed: boolean; msg: string }> => {
  const response = await fetch(`${CHECK_URL}?xnxqdm=${term}&_=${Date.now()}`, {
    headers: {
      Cookie: cookieHeader,
      Referer: categoryUrl,
      ...EDGE_USER_AGENT_HEADERS,
    },
  });

  if (response.status !== 200) throw `status: ${response.status}`;

  try {
    const content = await response.text();

    if (content.includes("评价已完成")) {
      return { completed: true, msg: "已完成评教" };
    }

    if (content.includes("下次可检查时间为：")) {
      const time = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.exec(content)?.[0];

      return { completed: false, msg: `检查过于频繁，请于 ${time} 后重试` };
    }

    if (content.includes("评价未完成")) {
      return { completed: false, msg: "未完成评教" };
    }

    console.log(content);

    return {
      completed: false,
      msg: "请检查是否完成评教",
    };
  } catch (err) {
    console.error(err);

    throw new Error("评教检查失败");
  }
};

export const underStudySelectInfoHandler: RequestHandler<
  EmptyObject,
  EmptyObject,
  UnderSelectInfoOptions
> = async (req, res) => {
  try {
    const { id, password, link } = req.body;

    if (id && password) {
      const result = await underStudyLogin({ id, password });

      if (!result.success) return res.json(result);

      req.headers.cookie = result.cookieStore.getHeader(UNDER_STUDY_SERVER);
    } else if (!req.headers.cookie) {
      return res.json(MissingCredentialResponse);
    }

    const cookieHeader = req.headers.cookie;

    if (!link) return res.json(MissingArgResponse("link"));

    const categoryUrl = `${UNDER_STUDY_SERVER}${link}`;

    const response = await fetch(categoryUrl, {
      headers: {
        Cookie: cookieHeader,
        Referer: categoryUrl,
        ...EDGE_USER_AGENT_HEADERS,
      },
      redirect: "manual",
    });

    if (response.status !== 200) return res.json(ExpiredResponse);

    let content = await response.text();

    if (content.match(/<title>.*?评教检查<\/title>/)) {
      console.log("评教检查");

      const { completed } = await checkCourseCommentary(
        cookieHeader,
        /xnxqdm=(\d+)'/.exec(content)![1],
        categoryUrl,
      );

      if (!completed) {
        return res.json({
          success: false,
          msg: "未完成评教",
          type: ActionFailType.MissingCommentary,
        });
      }

      // 重新请求选课信息
      const recheckResponse = await fetch(categoryUrl, {
        headers: {
          "Cache-Control": "max-age=0",
          Cookie: cookieHeader,
          Referer: categoryUrl,
          ...EDGE_USER_AGENT_HEADERS,
        },
        redirect: "manual",
      });

      if (recheckResponse.status !== 200) return res.json(ExpiredResponse);

      content = await recheckResponse.text();
    }

    if (content.includes("选课正在初始化")) {
      return res.json({
        success: false,
        msg: "选课正在初始化，请稍后再试",
        type: ActionFailType.NotInitialized,
      });
    }

    return res.json({
      success: true,
      data: getSelectInfo(content),
    } as UnderSelectInfoSuccessResponse);
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return res.json(UnknownResponse(message));
  }
};