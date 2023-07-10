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

interface RawBorrowBookData extends Record<string, unknown> {
  due_date: string;
  loan_date: string;
  title: string;
  author: string;
  publication_year: string;
  item_barcode: string;
  process_status: "RENEW" | string;
  location_code: {
    value: string;
    name: string;
  };
  item_policy: {
    value: string;
    description: string;
  };
  call_number: string;
  last_renew_date: string;
  last_renew_status: {
    value: string;
    desc: string;
  };
  loan_status: "ACTIVE";
}

type RawBorrowBooksData =
  | {
      success: true;
      data: RawBorrowBookData[];
    }
  | {
      success: false;
      data: "";
    };

export interface BorrowBookData {
  /** 书名 */
  name: string;
  /** 作者 */
  author: string;
  /** 出版年份 */
  year: number;
  /** 借阅状态 */
  status: string;
  /** 条形码 */
  barcode: string;
  /** 位置 */
  location: string;
  /** 书架号 */
  shelfNumber: string;
  /** 是否续借 */
  renew: boolean;
  /** 续借时间 */
  renewTime?: string;
}

const getBookData = ({
  title,
  author,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  item_barcode,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  location_code,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  call_number,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  process_status,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  last_renew_date,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  item_policy,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  publication_year,
}: RawBorrowBookData): BorrowBookData => ({
  name: title,
  author,
  year: Number(publication_year),
  barcode: item_barcode,
  location: location_code.name,
  shelfNumber: call_number,
  renew: process_status === "RENEW",
  renewTime: last_renew_date,
  status: item_policy.description,
});

export type BorrowBooksOptions = LoginOptions | CookieOptions;

export interface BorrowBooksSuccessResponse {
  status: "success";
  data: BorrowBookData[];
}

export type BorrowBooksResponse =
  | BorrowBooksSuccessResponse
  | CommonFailedResponse;

export const borrowBooksHandler: RequestHandler<
  EmptyObject,
  EmptyObject,
  LoginOptions | CookieOptions
> = async (req, res) => {
  try {
    let cookies: Cookie[] = [];

    if ("cookies" in req.body) {
      ({ cookies } = req.body);
    } else {
      const result = await actionLogin(req.body);

      if (result.status === "failed") return res.json(result);

      ({ cookies } = result);
    }

    const headers = {
      Accept: "application/json, text/javascript, */*; q=0.01",
      Cookie: getCookieHeader(cookies),
      Referer:
        "https://m-443.webvpn.nenu.edu.cn//basicInfo/studentPageTurn?type=lifestudying&tg=bookborrow",
    };

    console.log("Using headers", headers);

    const response = await fetch(
      "https://m-443.webvpn.nenu.edu.cn/basicInfo/getBookBorrow",
      {
        headers,
      },
    );

    console.log(response.status);

    const data = <RawBorrowBooksData>await response.json();

    if (data.success)
      return res.json(<BorrowBooksSuccessResponse>{
        status: "success",
        data: data.data.map(getBookData),
      });

    return res.json(<BorrowBooksSuccessResponse>{
      status: "success",
      data: [],
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
