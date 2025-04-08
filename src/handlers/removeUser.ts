import logger from "../logger.js";
import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { HttpReturnValue } from "../../../models/ReturnValue.js";

export async function removeUser(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    if (userInfo.username !== "orbadmin") {
        return res.status(403).json({ error: `User is not authorized to remove users` });
    }
    const user_id = req.params.user_id;
    return res.json(await ConnectRunDisconnect((adapter) => {
        return adapter.removeUser(user_id);
    }));
}