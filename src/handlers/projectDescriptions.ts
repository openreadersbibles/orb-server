import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";

export async function projectDescriptions() {
    return await ConnectRunDisconnect((adapter) => {
        return adapter.getProjectDescriptions();
    });
}