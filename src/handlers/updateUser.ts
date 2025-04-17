import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '@models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { WrappedBody } from "@models/SavedPostRequest.js";
import { Failure, returnValueConfig } from "@models/ReturnValue.js";
import { UserUpdateObject } from "@models/UserProfile.js";
import { UserIdParams } from '../params.js';

export async function updateUser(req: Request<UserIdParams, boolean, WrappedBody<UserUpdateObject>>, res: Response, userInfo: CognitoUserInfoResponse) {
    returnValueConfig.hash = req.body.hash;
    if (userInfo.username !== req.params.user_id && userInfo.username !== "orbadmin") {
        console.log(`User ID in request body (${userInfo.username}) does not match URL parameter (${req.params.user_id})`);
        return Failure(400, `User ID in request body (${userInfo.username}) does not match URL parameter (${req.params.user_id})`);
    }
    return await ConnectRunDisconnect<boolean>((adapter) => {
        return adapter.updateUser(userInfo.username, req.body.body);
    });
}