import { CognitoUserInfoResponse } from "@models/TimedOauthCredentials";

const mockedUserInfo: CognitoUserInfoResponse = {
    "email": "example@example.com",
    "email_verified": "true",
    "sub": "not sure what this is",
    "username": "orbadmin"
};

export const getMockedUser = () => mockedUserInfo;

// Function to set the mocked user
export const setMockedUser = (username: string) => {
    mockedUserInfo.username = username;
};
