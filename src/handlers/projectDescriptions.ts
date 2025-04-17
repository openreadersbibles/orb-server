import { ProjectDescription } from "@models/ProjectConfiguration.js";
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";

export async function projectDescriptions() {
    return await ConnectRunDisconnect<ProjectDescription[]>((adapter) => {
        return adapter.getProjectDescriptions();
    });
}