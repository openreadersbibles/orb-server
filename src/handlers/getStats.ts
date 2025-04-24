import { Request } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { StatsParams, StatsParamsSchema } from '../params.js';
import { StatsSummary } from '@models/StatsSummary.js';
import { Failure } from '@models/ReturnValue.js';

/// This function has a special behavior that, if the user is not found in the database
/// (and if the user_id) has been specified, then it will insert it into the database
/// and return the user object. 
export async function getStats(req: Request<StatsParams, StatsSummary>) {
    const params = StatsParamsSchema.safeParse(req.params);
    if (!params.success) {
        const msg = `Invalid parameters: ${params.error}`;
        console.error(msg);
        console.error(req.params);
        return Failure(400, msg);
    }
    return await ConnectRunDisconnect<StatsSummary>((adapter) => {
        return adapter.getStats(params.data.project_id, params.data.canon, params.data.book);
    });
}