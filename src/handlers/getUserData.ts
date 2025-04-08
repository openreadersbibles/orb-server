import logger from "../logger.js";
import { Request, Response } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { HttpReturnValue } from "../../../models/ReturnValue.js";

/// This function has a special behavior that, if the user is not found in the database
/// (and if the user_id) has been specified, then it will insert it into the database
/// and return the user object. 
export async function getUserData(req: Request, res: Response): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    const user_id = req.params.user_id;
    return res.json(await ConnectRunDisconnect((adapter) => {
        return adapter.getUserData(user_id);
    }));
}