import type { RequestHandler } from "express";
import type { Cookie } from "set-cookie-parser";

import { underSystemLogin } from "./login.js";
import { getTimeStamp } from "./utils.js";
import type { LoginFailedResponse } from "../auth/index.js";
import type { CookieOptions, EmptyObject, LoginOptions } from "../typings.js";
import { IE_8_USER_AGENT, getCookieHeader } from "../utils/index.js";

type CourseType =
  | "通识教育必修课"
  | "通识教育选修课"
  | "专业教育必修课"
  | "专业教育选修课"
  | "教师职业教育必修课"
  | "教师职业教育选修课"
  | "任意选修课"
  | "发展方向课"
  | "教师教育必修课"
  | "教师教育选修课";

interface UserGradeListExtraOptions {
  /** 查询时间 */
  time?: string;
  /** 课程名称 */
  name?: string;
  /** 课程性质 */
  courseType?: CourseType;
  gradeType?: "all" | "best";
}

export type UserGradeListOptions = (LoginOptions | CookieOptions) &
  UserGradeListExtraOptions;

export interface GradeResult {
  /** 修读时间 */
  time: string;
  /** 课程 id */
  cid: string;
  /** 课程名称 */
  name: string;
  /** 难度系数 */
  difficulty: number;
  /** 分数 */
  grade: number;
  /** 绩点成绩 */
  gradePoint: number;
  /** 成绩标志 */
  mark: string;
  /** 课程类型 */
  courseType: string;
  /** 选修课类型 */
  commonType: string;
  /** 课程类型短称 */
  shortCourseType: string;
  /** 学时 */
  hours: number | null;
  /** 学分 */
  point: number;
  /** 考试性质 */
  examType: string;
  /** 补重学期 */
  reLearn: string;
  /** 审核状态 */
  status: string;
}

export interface UserGradeListSuccessResponse {
  status: "success";
  data: GradeResult[];
}

export type UserGradeListFailedResponse = LoginFailedResponse;

export type UserGradeListResponse =
  | UserGradeListSuccessResponse
  | UserGradeListFailedResponse;

const gradeItemRegExp = /<tr.+?class="smartTr"[^>]*?>(.*?)<\/tr>/g;
const gradeCellRegExp =
  /^(?:<td[^>]*?>[^<]*?<\/td>){3}<td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^>]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^>]*?)<\/td><td[^>]*?>(.*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td><td[^>]*?>([^<]*?)<\/td>/;
const gradeNumberRegExp = /<a[^>]*?>([^<]*?)<\/a>/;

const tableFieldsRegExp =
  /<input type="hidden"\s+name\s*=\s*"tableFields"\s+id\s*=\s*"tableFields"\s+value="([^"]+?)">/;
const sqlRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"isSql"\s+id\s*=\s*"isSql"\s+value="(.*?)">/;
// const where1RegExp =
//   /<input\s+type="hidden"\s+name\s*=\s*"where1"\s+id\s*=\s*"where1"\s+value="(.*?)">/;
// const where2RegExp =
//   /<input\s+type="hidden"\s+name\s*=\s*"where2"\s+id\s*=\s*"where2"\s+value="(.*?)">/;
// const beanNameRegExp =
//   /<input\s+type="hidden"\s+name\s*=\s*"beanName"\s+id\s*=\s*"beanName"\s+value="(.*?)">/;
const printPageSizeRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"printPageSize"\s+id\s*=\s*"printPageSize"\s+value="(.*?)">/;
const keyRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"key"\s+id\s*=\s*"key"\s+value="(.*?)">/;

const fieldRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"field"\s+id\s*=\s*"field"\s+value="(.*?)">/;
const totalPagesRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"totalPages"\s+id\s*=\s*"totalPages"\s+value="(.*?)">/;
const otherFieldsRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"otherFields"\s+id\s*=\s*"otherFields"\s+value="(.*?)">/;
const xsIdRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"xsId"\s+id\s*=\s*"xsId"\s+value="(.*?)" \/>/;

const courseTypes: Record<CourseType, string> = {
  通识教育必修课: "01",
  通识教育选修课: "02",
  专业教育必修课: "03",
  专业教育选修课: "04",
  教师职业教育必修课: "05",
  教师职业教育选修课: "06",
  任意选修课: "09",
  发展方向课: "10",
  教师教育必修课: "11",
  教师教育选修课: "12",
};

const getDisplayTime = (time: string): string => {
  const [startYear, endYear, semester] = time.split("-");

  return semester === "1" ? `${startYear}年秋季学期` : `${endYear}年春季学期`;
};

export const getGrades = (content: string): GradeResult[] =>
  Array.from(content.matchAll(gradeItemRegExp)).map(([, item]) => {
    const [
      ,
      time,
      cid,
      name,
      difficulty,
      grade,
      gradePoint,
      mark = "",
      courseType,
      commonType,
      shortCourseType,
      hours,
      point,
      examType,
      reLearn,
      status,
    ] = Array.from(gradeCellRegExp.exec(item)!).map((item) =>
      item.replace(/&nbsp;/g, " ").trim()
    );

    const actualDifficulty = Number(difficulty) || 1;
    const actualGrade = grade
      ? Number(gradeNumberRegExp.exec(grade)) ||
        Math.round(Number(gradePoint) / Number(point) / actualDifficulty + 5) *
          10
      : Math.round(Number(gradePoint) / Number(point) / actualDifficulty + 5) *
        10;

    return {
      time,
      cid,
      name,
      difficulty: Number(difficulty) || 1,
      grade: actualGrade,
      gradePoint: Number(gradePoint),
      mark,
      courseType,
      commonType,
      shortCourseType,
      hours: hours ? Number(hours) : null,
      point: Number(point),
      examType,
      reLearn: reLearn ? getDisplayTime(reLearn) : "",
      status,
    };
  });

export const getGradeLists = async (
  content: string
): Promise<GradeResult[]> => {
  const totalPages = totalPagesRegExp.exec(content)![1];

  if (Number(totalPages) === 1) return getGrades(content);

  const tableFields = tableFieldsRegExp.exec(content)![1];
  const isSql = sqlRegExp.exec(content)![1];
  // const beanName = beanNameRegExp.exec(content);
  const printPageSize = printPageSizeRegExp.exec(content)![1];
  const key = keyRegExp.exec(content)![1];
  const field = fieldRegExp.exec(content)![1];

  const params = new URLSearchParams({
    tableFields,
    isSql,
    printPageSize,
    key,
    field,
  });

  const result = await fetch("");
  const responseText = await result.text();

  return getGrades(responseText);
};

export const underGradeListHandler: RequestHandler<
  EmptyObject,
  EmptyObject,
  UserGradeListOptions
> = async (req, res) => {
  try {
    let cookies: Cookie[] = [];

    const {
      time = "",
      name = "",
      courseType = "",
      gradeType = "all",
    } = req.body;

    if ("cookies" in req.body) {
      ({ cookies } = req.body);
    } else {
      const result = await underSystemLogin(req.body);

      if (result.status === "failed") return res.json(result);

      ({ cookies } = result);
    }

    const params = new URLSearchParams({
      kksj: time,
      kcxz: courseType ? courseTypes[courseType] || "" : "",
      kcmc: name,
      xsfs: gradeType === "best" ? "zhcj" : gradeType === "all" ? "qbcj" : "",
      ok: "",
    });

    console.log("Using params", params);

    const headers = {
      Cookie: getCookieHeader(cookies),
      Referer: `https://dsjx.webvpn.nenu.educn/jiaowu/cjgl/xszq/query_xscj.jsp?tktime=${getTimeStamp()}`,
      "User-Agent": IE_8_USER_AGENT,
    };

    console.log("Using headers", headers);

    const response = await fetch(
      `https://dsjx.webvpn.nenu.edu.cn/xszqcjglAction.do?method=queryxscj`,
      {
        method: "POST",
        headers,
        body: params.toString(),
      }
    );

    console.log(response.status);

    const content = await response.text();

    const gradeList = await getGradeLists(content);

    return res.json(<UserGradeListSuccessResponse>{
      status: "success",
      data: gradeList,
    });
  } catch (err) {
    res.json(<LoginFailedResponse>{
      status: "failed",
      msg: (<Error>err).message,
    });
  }
};
