import logger from "../logger.js";
import { Request, Response } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { HttpReturnValue } from "../../../models/ReturnValue.js";

export async function getProjectIdExists(req: Request, res: Response): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    const project_id = req.params.project_id;
    return res.json(await ConnectRunDisconnect((adapter) => {
        return adapter.getProjectIdExists(project_id);
    }));
}