import { Request } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { ProjectIdParams } from "../params.js";

export async function getProjectIdExists(req: Request<ProjectIdParams, boolean>) {
    const project_id = req.params.project_id;
    return await ConnectRunDisconnect<boolean>((adapter) => {
        return adapter.getProjectIdExists(project_id);
    });
}