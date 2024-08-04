import { ActionFailType } from "../../config/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../typings.js";
import { authEncrypt } from "../auth-encrypt.js";
import type { ResetCaptchaInfo } from "../reset-captcha.js";
import { getResetCaptcha } from "../reset-captcha.js";
import { RESET_PREFIX, RESET_SALT } from "../utils.js";

const SEND_CODE_URL = `${RESET_PREFIX}/passwordRetrieve/sendCode`;

interface RawResetPasswordSendCodeInfo {
  limitTime: number;
  sign: string;
}

interface RawResetPasswordSendCodeSuccessData {
  code: "0";
  message: null;
  datas: string;
}

interface RawResetPasswordSendCodeFailedData {
  code: "2106990000";
  message: string;
  datas: null;
}

type RawResetPasswordSendCodeData =
  | RawResetPasswordSendCodeSuccessData
  | RawResetPasswordSendCodeFailedData;

export interface ResetPasswordSendCodeOptions {
  type: "send-code";
  /** 学号 */
  id: string;
  /** 验证码图片 base64 字符串 */
  captcha: string;
  /** 验证码 ID */
  captchaId: string;
  cellphone: string;
  email: string;
  hideCellphone: string;
  hideEmail: string;
  isAppealFlag: "0" | "1";
  appealSign: string;
  sign: string;
}

export type ResetPasswordSendCodeSuccessResponse = CommonSuccessResponse<{
  limitTime: number;
  sign: string;
}>;

export type ResetPasswordSendCodeResponse =
  | ResetPasswordSendCodeSuccessResponse
  | (CommonFailedResponse<ActionFailType.WrongCaptcha> & {
      data: ResetCaptchaInfo;
    })
  | CommonFailedResponse<ActionFailType.Restricted | ActionFailType.Unknown>;

export const sendCode = async (
  {
    id,
    captcha,
    captchaId,
    cellphone,
    email,
    hideCellphone,
    hideEmail,
    isAppealFlag,
    appealSign,
    sign,
  }: ResetPasswordSendCodeOptions,
  cookieHeader: string,
): Promise<ResetPasswordSendCodeResponse> => {
  const verifyResponse = await fetch(SEND_CODE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "cellphone",
      loginNo: id,
      captcha,
      captchaId,
      hideCellphone,
      hideEmail,
      cellphone: cellphone ? authEncrypt(cellphone, RESET_SALT) : "",
      email: email ? authEncrypt(email, RESET_SALT) : "",
      code: "",
      password: "",
      confirmPassword: "",
      isAppealFlag,
      appealSign,
      sign,
    }),
  });

  const data = (await verifyResponse.json()) as RawResetPasswordSendCodeData;

  if (data.code !== "0") {
    if (data.message === "验证码不正确") {
      const captchaResponse = await getResetCaptcha();

      if (!captchaResponse.success) return captchaResponse;

      return {
        success: false,
        type: ActionFailType.WrongCaptcha,
        msg: data.message,
        data: captchaResponse.data,
      };
    }

    return {
      success: false,
      type: ActionFailType.Unknown,
      msg: data.message,
    };
  }

  return {
    success: true,
    data: JSON.parse(data.datas) as RawResetPasswordSendCodeInfo,
  };
};
