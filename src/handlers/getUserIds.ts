import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";

export async function getUserIds() {
    return await ConnectRunDisconnect<string[]>((adapter) => {
        return adapter.getUserIds();
    });
}