import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '@models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { WrappedBody } from "@models/WrappedBody.js";
import { returnValueConfig } from "@models/ReturnValue.js";
import { NoParams } from '../params.js';
import { ProjectConfigurationRow, ProjectConfigurationRowSchema } from '@models/ProjectConfigurationRow.js';

export async function createProject(req: Request<NoParams, boolean, WrappedBody<ProjectConfigurationRow>>, res: Response, userInfo: CognitoUserInfoResponse) {
    returnValueConfig.hash = req.body.hash;
    const parseResult = ProjectConfigurationRowSchema.safeParse(req.body.body);
    if (!parseResult.success) {
        res.status(400).json({ error: "Invalid project configuration data" });
        return false;
    } else {
        return await ConnectRunDisconnect<boolean>((adapter) => {
            return adapter.createProject(userInfo.username, parseResult.data);
        });
    }
}