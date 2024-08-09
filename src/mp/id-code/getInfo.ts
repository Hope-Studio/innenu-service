import type { RowDataPacket } from "mysql2";

import { ActionFailType, DatabaseError } from "../../config/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../typings.js";
import { connect } from "../../utils/index.js";

export interface GetInfoOptions {
  uuid: string;
  remark?: string;
}

export interface InfoData {
  name: string;
  gender: string;
  school: string;
  major: string;
  grade: number;
  createTime: number;
  remark: string;
}

export type GetInfoSuccessResponse = CommonSuccessResponse<InfoData>;

export type GetInfoResponse =
  | GetInfoSuccessResponse
  | CommonFailedResponse<
      ActionFailType.DatabaseError | ActionFailType.WrongInfo
    >;

export const getInfo = async ({
  uuid,
  remark,
}: GetInfoOptions): Promise<GetInfoResponse> => {
  try {
    const { connection, release } = await connect();

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT * FROM student_info WHERE uuid = ?`,
      [uuid],
    );

    if (rows.length === 0)
      return {
        success: false,
        type: ActionFailType.WrongInfo,
        msg: "UUID 不存在",
      };

    const row = rows[0] as InfoData;

    await connection.execute(
      `UPDATE student_info SET verifyTime = ?, verifyRemark = ? WHERE uuid = ?`,
      [Math.round(Date.now() / 1000), remark ?? "", uuid],
    );

    release();

    return {
      success: true,
      data: row,
    };
  } catch (err) {
    console.error(err);

    return DatabaseError((err as Error).message);
  }
};
