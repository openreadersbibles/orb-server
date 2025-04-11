import { Request, Response } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { ProjectIdParams } from "../params.js";

export async function getProjectIdExists(req: Request<ProjectIdParams, boolean>, res: Response) {
    const project_id = req.params.project_id;
    return await ConnectRunDisconnect((adapter) => {
        return adapter.getProjectIdExists(project_id);
    });
}