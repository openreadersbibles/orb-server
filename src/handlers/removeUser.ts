import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '@models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { UserIdParams } from '../params.js';
import { Failure } from '@models/ReturnValue.js';

export async function removeUser(req: Request<UserIdParams, boolean>, res: Response, userInfo: CognitoUserInfoResponse) {
    if (userInfo.username !== "orbadmin") {
        return Failure(403, `User is not authorized to remove users`);
    }
    const user_id = req.params.user_id;
    return await ConnectRunDisconnect((adapter) => {
        return adapter.removeUser(user_id);
    });
}