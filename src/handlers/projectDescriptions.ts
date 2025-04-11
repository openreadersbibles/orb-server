import { Request, Response } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { ProjectDescription } from "../../../models/ProjectConfiguration.js";
import { NoParams } from '../params.js';

export async function projectDescriptions(req: Request<NoParams, ProjectDescription[]>, res: Response) {
    return await ConnectRunDisconnect((adapter) => {
        return adapter.getProjectDescriptions();
    });
}