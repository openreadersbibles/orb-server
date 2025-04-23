import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '@models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { WrappedBody } from "@models/WrappedBody.js";
import { Failure, returnValueConfig } from "@models/ReturnValue.js";
import { UserIdParams } from '../params.js';
import { UserUpdateObject, UserUpdateObjectSchema } from '@models/UserUpdateObject.js';

export async function updateUser(req: Request<UserIdParams, boolean, WrappedBody<UserUpdateObject>>, res: Response, userInfo: CognitoUserInfoResponse) {
    returnValueConfig.hash = req.body.hash;
    const parseResult = UserUpdateObjectSchema.safeParse(req.body.body);
    if (!parseResult.success) {
        console.error("Invalid user update data", parseResult.error.format());
        return Failure(400, "Invalid user update data");
    } else {
        return await ConnectRunDisconnect<boolean>((adapter) => {
            return adapter.updateUser(userInfo.username, parseResult.data);
        });
    }
}