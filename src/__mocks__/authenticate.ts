import { CognitoUserInfoResponse } from "@models/TimedOauthCredentials.js";
import { getMockedUser } from "../MockUser";

// Mock the module where authenticateAndThenCall is defined
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function authenticate(token: string): Promise<CognitoUserInfoResponse> {
    return Promise.resolve(getMockedUser());
}
