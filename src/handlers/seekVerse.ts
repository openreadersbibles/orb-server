import logger from "../logger.js";
import { Request, Response } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { VerseReference } from "../../../models/VerseReference.js";
import { HttpReturnValue } from "../../../models/ReturnValue.js";

export async function seekVerse(req: Request, res: Response): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    try {
        const user_id = req.params.user_id;
        const project_id = req.params.project_id;
        const startingPosition = VerseReference.fromString(req.params.startingPosition) || new VerseReference("GEN", 1, 1, "OT");
        const direction = req.params.direction as "before" | "after";
        const exclusivity = req.params.exclusivity as "me" | "anyone";
        const frequency_threshold = Number.parseInt(req.params.frequency_threshold);

        console.info(`Seeking verse for user ${user_id} in project ${project_id} starting at ${startingPosition} in direction ${direction} with exclusivity ${exclusivity} and frequency threshold ${frequency_threshold}`);

        return res.json(await ConnectRunDisconnect(async (adapter) => {
            return adapter.seekVerse(project_id, user_id, frequency_threshold, startingPosition, direction, exclusivity);
        }));
    } catch (error) {
        logger.error(`Error in getVerse: ${error}`);
        return res.status(500).json({ error: `Internal server error: ${error}` });
    }
}