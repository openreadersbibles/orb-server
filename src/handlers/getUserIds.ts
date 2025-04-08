import logger from "../logger.js";
import { Request, Response } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { HttpReturnValue } from "../../../models/ReturnValue.js";

export async function getUserIds(req: Request, res: Response): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    return res.json(await ConnectRunDisconnect((adapter) => {
        return adapter.getUserIds();
    }));
}