import { MariaDbAdapter } from "./MariaDbAdapter.js";
import { GenericDatabaseAdapter } from "./GenericDatabaseAdapter.js";

/// This returns a database adapter based on the environment variable WHICH_DATABASE
/// This enables both local SQLite and cloud-based Amazon RDS
export async function GetDatabaseAdapter(): Promise<GenericDatabaseAdapter> {
    if (process.env.WHICH_DATABASE === "sqlite") {
        return Promise.reject("SQLite is not supported in this version of the code.");
        // return new SqliteAdapter();
    } else {
        try {
            const adapter = new MariaDbAdapter();
            await adapter.connect();
            return adapter;
        } catch (error) {
            console.error(error);
            return Promise.reject("Error connecting to the server.");
        }
    }
}

export async function ConnectRunDisconnect<T>(run: (adapter: GenericDatabaseAdapter) => Promise<T>): Promise<T> {
    const adapter = await GetDatabaseAdapter();
    try {
        const result = await run(adapter);
        return result;
    } catch (error) {
        throw error;
    } finally {
        await adapter.disconnect();
    }
}