import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '@models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { WrappedBody } from "@models/SavedPostRequest.js";
import { returnValueConfig } from "@models/ReturnValue.js";
import { ProjectConfigurationRow } from "@models/ProjectConfiguration.js";
import { NoParams } from '../params.js';

export async function createProject(req: Request<NoParams, boolean, WrappedBody<ProjectConfigurationRow>>, res: Response, userInfo: CognitoUserInfoResponse) {
    returnValueConfig.hash = req.body.hash;
    return await ConnectRunDisconnect<boolean>((adapter) => {
        return adapter.createProject(userInfo.username, req.body.body);
    });
}