import type { RequestHandler } from "express";

import { underSystemLogin } from "./login.js";
import { getTimeStamp } from "./utils.js";
import type { AuthLoginFailedResult } from "../auth/index.js";
import type {
  CommonFailedResponse,
  CookieOptions,
  EmptyObject,
  LoginOptions,
} from "../typings.js";
import {
  CookieStore,
  IE_8_USER_AGENT,
  getCookieItems,
} from "../utils/index.js";

const NAME_REGEXP =
  /<td>姓&nbsp;名<\/td>\s+<td colspan="3">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/;
const GENDER_REGEXP =
  /<td>性&nbsp;别<\/td>\s+<td colspan="2">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/;
const PEOPLE_REGEXP =
  /<td>民&nbsp;族<\/td>\s+<td colspan="3">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/;
const POLITICAL_TYPE_REGEXP =
  /<td>政治面貌<\/td>\s+<td colspan="2">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/;
const ID_CARD_REGEXP =
  /<td>身份证号<\/td>\s+<td colspan="3">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/;

const ID_REGEXP =
  /<td>学&nbsp;籍&nbsp;号<\/td>\s+<td colspan="3">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/;
const SCHOOL_REGEXP =
  /<td>就读学院<\/td>\s+<td colspan="3">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/;
const MAJOR_REGEXP =
  /<td>就读专业<\/td>\s+<td colspan="3">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/;
const MAJOR_TYPE_REGEXP =
  /<td>专业类别<\/td>\s+<td colspan="2">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/;
const IN_DATE_REGEXP =
  /<td>入学日期<\/td>\s+<td colspan="2">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/;

const LANGUAGE_REGEXP =
  /<td>高考语种<\/td>\s+<td colspan="3">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/;
const CULTIVATE_ID =
  /<td>考&nbsp;生&nbsp;号<\/td>\s+<td colspan="3">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/;
const CULTIVATE_TYPE_REGEXP =
  /<td>培养方式<\/td>\s+<td colspan="2">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/;
const PROVINCE_REGEXP =
  /<td>生源省份<\/td>\s+<td colspan="2">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/;
const CANDIDATE_TYPE_REGEXP =
  /<td>考生类别<\/td>\s+<td colspan="2">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/;

export const STUDENT_ARCHIVE_QUERY_URL =
  "https://dsjx.webvpn.nenu.edu.cn/xszhxxAction.do?method=addStudentPic_xszc";

export interface StudyArchiveInfo {
  /** 姓名 */
  name: string;
  /** 性别 */
  gender: "男" | "女";
  /** 身份证号 */
  idCard: string;
  /** 政治面貌 */
  politicalType: string;
  /** 出生日期 */
  birth: string;
  /** 民族 */
  people: string;

  /** 学号 */
  id: number;
  /** 年级 */
  grade: number;
  /** 学院 */
  school: string;
  /** 专业 */
  major: string;
  /** 专业类别 */
  majorType: string;
  /** 入学日期 */
  inDate: string;

  /** 高考语种 */
  language: string;
  /** 考生号 */
  candidateId: number;
  /** 考生类别 */
  candidateType: string;
  /** 生源省份 */
  province: string;
  /** 培养方式 */
  cultivateType: string;
}

const getInfo = (content: string): StudyArchiveInfo => {
  const name = NAME_REGEXP.exec(content)![1];
  const gender = <"男" | "女">GENDER_REGEXP.exec(content)![1];
  const people = PEOPLE_REGEXP.exec(content)![1];
  const idCard = ID_CARD_REGEXP.exec(content)![1];
  const politicalType = POLITICAL_TYPE_REGEXP.exec(content)![1];
  const birth = idCard
    .substring(6, 14)
    .replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");

  const id = ID_REGEXP.exec(content)![1];
  const school = SCHOOL_REGEXP.exec(content)![1];
  const major = MAJOR_REGEXP.exec(content)![1];
  const majorType = MAJOR_TYPE_REGEXP.exec(content)![1];
  const inDate = IN_DATE_REGEXP.exec(content)![1];

  const language = LANGUAGE_REGEXP.exec(content)![1];
  const candidateId = Number(CULTIVATE_ID.exec(content)![1]);
  const cultivateType = CULTIVATE_TYPE_REGEXP.exec(content)![1];
  const candidateType = CANDIDATE_TYPE_REGEXP.exec(content)![1];
  const province = PROVINCE_REGEXP.exec(content)![1];

  return {
    name,
    gender,
    idCard,
    people,
    politicalType,
    birth,

    id: Number(id),
    grade: Number(id.substring(0, 4)),
    school,
    major,
    majorType,
    inDate,

    language,
    candidateId,
    candidateType,
    cultivateType,
    province,
  };
};

export type StudyArchiveOptions = LoginOptions | CookieOptions;

export interface StudyArchiveSuccessResponse {
  success: true;
  info: StudyArchiveInfo;
}

export type StudyArchiveResponse =
  | StudyArchiveSuccessResponse
  | AuthLoginFailedResult
  | CommonFailedResponse;

export const getStudyArchiveInfo = async (
  cookieHeader: string,
): Promise<StudyArchiveResponse> => {
  const response = await fetch(
    `${STUDENT_ARCHIVE_QUERY_URL}&tktime=${getTimeStamp()}`,
    {
      headers: {
        Cookie: cookieHeader,
        Referer:
          "https://dsjx.webvpn.nenu.edu.cn/framework/new_window.jsp?lianjie=&winid=win3",
        "User-Agent": IE_8_USER_AGENT,
      },
    },
  );

  const content = await response.text();

  if (content.includes("学生学籍卡片")) {
    const info = getInfo(content);

    return <StudyArchiveSuccessResponse>{
      success: true,
      info,
    };
  }

  return {
    success: false,
    msg: "获取学籍信息失败",
  };
};

export const underStudyArchiveHandler: RequestHandler<
  EmptyObject,
  EmptyObject,
  StudyArchiveOptions
> = async (req, res) => {
  try {
    const cookieStore = new CookieStore();

    if (!req.headers.cookie)
      if ("cookies" in req.body) {
        cookieStore.apply(getCookieItems(req.body.cookies));
      } else {
        const result = await underSystemLogin(req.body, cookieStore);

        if (!result.success) return res.json(result);
      }

    const cookieHeader =
      req.headers.cookie || cookieStore.getHeader(STUDENT_ARCHIVE_QUERY_URL);

    return res.json(await getStudyArchiveInfo(cookieHeader));
  } catch (err) {
    const { message } = <Error>err;

    console.error(err);
    res.json(<AuthLoginFailedResult>{
      success: false,
      msg: message,
    });
  }
};