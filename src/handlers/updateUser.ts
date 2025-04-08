import logger from "../logger.js";
import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { WrappedBody } from "../../../models/SavedPostRequest.js";
import { HttpReturnValue, returnValueConfig } from "../../../models/ReturnValue.js";
import { UserUpdateObject } from "../../../models/UserProfile.js";

export async function updateUser(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    const wrappedBody: WrappedBody = req.body;
    const user_id = req.params.user_id;
    returnValueConfig.hash = wrappedBody.hash;
    const request = wrappedBody.body as UserUpdateObject;
    if (userInfo.username !== user_id && userInfo.username !== "orbadmin") {
        return res.status(400).json({ error: `User ID in request body does not match URL parameter` });
    }
    return res.json(await ConnectRunDisconnect((adapter) => {
        return adapter.updateUser(userInfo.username, request);
    }));
}