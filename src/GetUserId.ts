import { UserId } from "../../models/UserProfile";

export function GetUserId(event: any): UserId {
    if (process.env.USER_ID === undefined || process.env.USER_ID.length === 0) {
        return event.requestContext.authorizer.claims['cognito:username'] as UserId;
    } else {
        return process.env.USER_ID;
    }
}