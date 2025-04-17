import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '@models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { WrappedBody } from '@models/WrappedBody.js';
import { returnValueConfig } from '@models/ReturnValue.js';
import { ProjectIdParams } from '../params.js';

export async function joinProject(req: Request<ProjectIdParams, boolean, WrappedBody<null>>, res: Response, userInfo: CognitoUserInfoResponse) {
    returnValueConfig.hash = req.body.hash;
    return await ConnectRunDisconnect<boolean>((adapter) => {
        return adapter.joinProject(userInfo.username, req.params.project_id);
    });
}