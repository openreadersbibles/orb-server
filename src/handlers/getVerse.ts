import logger from "../logger.js";
import { Request, Response } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { HttpReturnValue } from "../../../models/ReturnValue.js";

export async function getVerse(req: Request, res: Response): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    try {
        const user_id = req.params.user_id;
        const project_id = req.params.project_id;
        const reference = req.params.reference;
        return res.json(await ConnectRunDisconnect((adapter) => {
            return adapter.getVerse(project_id, user_id, reference);
        }));
    } catch (error) {
        logger.error(`Error in getVerse: ${error}`);
        return res.status(500).json({ error: `Internal server error: ${error}` });
    }
}