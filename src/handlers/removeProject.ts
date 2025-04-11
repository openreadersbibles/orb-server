import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { ProjectIdParams } from '../params.js';
import { Failure } from '../../../models/ReturnValue.js';

export async function removeProject(req: Request<ProjectIdParams, boolean>, res: Response, userInfo: CognitoUserInfoResponse) {
    if (userInfo.username !== "orbadmin") {
        return Failure(403, `User is not authorized to remove projects`);
    }
    return await ConnectRunDisconnect((adapter) => {
        return adapter.removeProject(req.params.project_id);
    });
}