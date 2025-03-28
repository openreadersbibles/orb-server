import { HollowPublicationRequest } from "../../models/PublicationRequest";
import { Publisher } from "./Publisher";

export async function createPublisher(request: HollowPublicationRequest): Promise<Publisher> {
    /// Check to see if the required fields are present
    if (request.project_id === undefined
        || request.books === undefined
        || request.parsing_formats === undefined) {
        throw "Missing required fields.";
    }

    try {
        const publisher = new Publisher();
        /// Connect to the database and initialize some variables
        await publisher.initialize(request);
        return publisher;
    } catch (error) {
        return Promise.reject(error);
    }
}
