import { CognitoUserInfoResponse } from "@models/TimedOauthCredentials.js";

export const mockedUserInfo: CognitoUserInfoResponse = {
    "email": "example@example.com",
    "email_verified": "true",
    "sub": "not sure what this is",
    "username": "orbadmin"
};

// Function to set the mocked user
export const setMockedUser = (username: string) => {
    mockedUserInfo.username = username;
};

// Mock the module where authenticateAndThenCall is defined
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function authenticate(token: string): Promise<CognitoUserInfoResponse> {
    return Promise.resolve(mockedUserInfo);
}
