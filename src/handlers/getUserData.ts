import { Request, Response } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { UserProfileRow } from "../../../models/UserProfile.js";
import { UserIdParams } from '../params.js';

/// This function has a special behavior that, if the user is not found in the database
/// (and if the user_id) has been specified, then it will insert it into the database
/// and return the user object. 
export async function getUserData(req: Request<UserIdParams, UserProfileRow>, res: Response) {
    const user_id = req.params.user_id;
    return await ConnectRunDisconnect((adapter) => {
        return adapter.getUserData(user_id);
    });
}