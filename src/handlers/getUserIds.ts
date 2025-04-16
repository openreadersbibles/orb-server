import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";

export async function getUserIds() {
    return await ConnectRunDisconnect((adapter) => {
        return adapter.getUserIds();
    });
}