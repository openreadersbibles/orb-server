import { Request, Response } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { NoParams } from '../params.js';

export async function getUserIds(req: Request<NoParams, string[]>, res: Response) {
    return await ConnectRunDisconnect((adapter) => {
        return adapter.getUserIds();
    });
}