import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '@models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { WrappedBody } from '@models/WrappedBody.js';
import { returnValueConfig } from '@models/ReturnValue.js';
import { VerseParams } from "../params.js";
import { UpdateVerseData } from '@models/UpdateVerseData.js';

export async function updateVerse(req: Request<VerseParams, boolean, WrappedBody<UpdateVerseData>>, res: Response, userInfo: CognitoUserInfoResponse) {
    returnValueConfig.hash = req.body.hash;
    return await ConnectRunDisconnect<boolean>((adapter) => {
        return adapter.updateVerse(
            userInfo.username,
            req.body.body,
            req.params.project_id)
    });
}