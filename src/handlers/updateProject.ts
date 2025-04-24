import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '@models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { WrappedBody } from "@models/WrappedBody.js";
import { Failure, returnValueConfig } from "@models/ReturnValue.js";
import { ProjectIdParams } from '../params.js';
import { ProjectConfigurationRow, ProjectConfigurationRowSchema } from '@models/ProjectConfigurationRow.js';

export async function updateProject(req: Request<ProjectIdParams, boolean, WrappedBody<ProjectConfigurationRow>>, res: Response, userInfo: CognitoUserInfoResponse) {
    returnValueConfig.hash = req.body.hash;
    const parseResult = ProjectConfigurationRowSchema.safeParse(req.body.body);
    if (!parseResult.success) {
        return Failure(400, `Invalid project configuration data: ${parseResult.error}`);
    } else {
        return await ConnectRunDisconnect<boolean>((adapter) => {
            return adapter.updateProject(userInfo.username, req.body.body);
        });
    }
}