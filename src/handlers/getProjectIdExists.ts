import logger from "../logger";
import { Request, Response } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter";
import { HttpReturnValue } from "../../../models/ReturnValue";

export async function getProjectIdExists(req: Request, res: Response): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    try {
        const project_id = req.params.project_id;
        return res.json(await ConnectRunDisconnect((adapter) => {
            return adapter.getProjectIdExists(project_id);
        }));
    } catch (error) {
        logger.error(`Error in getVerse: ${error}`);
        return res.status(500).json({ error: `Internal server error: ${error}` });
    }
}