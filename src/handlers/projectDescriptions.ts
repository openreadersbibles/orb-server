import { ProjectDescription } from "@models/ProjectDescription.js";
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";

export async function projectDescriptions() {
    return await ConnectRunDisconnect<ProjectDescription[]>((adapter) => {
        return adapter.getProjectDescriptions();
    });
}