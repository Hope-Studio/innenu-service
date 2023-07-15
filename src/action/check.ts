import type { RequestHandler } from "express";

import { SERVER } from "./utils.js";
import type {
  CommonFailedResponse,
  CookieOptions,
  CookieVerifySuccessResponse,
  EmptyObject,
} from "../typings.js";
import { IE_8_USER_AGENT, cookies2Header } from "../utils/index.js";

export const actionCheckHandler: RequestHandler<
  EmptyObject,
  EmptyObject,
  CookieOptions
> = async (req, res) => {
  try {
    const response = await fetch(`${SERVER}/page/getidentity`, {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        Cookie: req.headers.cookie || cookies2Header(req.body.cookies),
        "User-Agent": IE_8_USER_AGENT,
      },
      redirect: "manual",
    });

    if (response.status === 200) {
      try {
        const result = <{ success: boolean }>await response.json();

        if (result.success)
          return res.json(<CookieVerifySuccessResponse>{
            success: true,
            valid: true,
          });
      } catch (err) {
        return res.json(<CookieVerifySuccessResponse>{
          success: true,
          valid: false,
        });
      }

      return;
    }

    return res.json(<CookieVerifySuccessResponse>{
      success: true,
      valid: false,
    });
  } catch (err) {
    const { message } = <Error>err;

    console.error(err);
    res.json(<CommonFailedResponse>{
      success: false,
      msg: message,
    });
  }
};
