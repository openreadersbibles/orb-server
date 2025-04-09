import { ApiCallHandler } from "./authenticateAndThenCall.js";
import { Request, Response } from 'express';
import logger from './logger.js';
import { CognitoUserInfoResponse } from "../../models/TimedOauthCredentials.js";

let mockedUserInfo: CognitoUserInfoResponse = {
    "email": "example@example.com",
    "email_verified": "true",
    "sub": "not sure what this is",
    "username": "filler_username"
};
export let mockedUser: string | undefined;

// Function to set the mocked user
export const setMockedUser = (username: string) => {
    mockedUserInfo.username = username;
    mockedUser = username;
};

// Mock the module where authenticateAndThenCall is defined
jest.mock('../src/authenticateAndThenCall', () => ({
    authenticateAndThenCall: jest.fn().mockImplementation(async (req: Request, res: Response, next: ApiCallHandler) => {
        try {
            /// here is where the function is actually called:
            try {
                return await next(req, res, mockedUserInfo);
            } catch (error: any) {
                /// if a promise is rejected in the database adapter, it will throw an error
                /// and we need to catch it here, and pass the return value back
                if (error.statusCode && error.body) {
                    return res.status(error.statusCode).json({ error: error.body });
                } else {
                    /// this is an unhandled exception, and we need to log it and return a 500 error
                    logger.error(`Error in updateUser: ${error}`);
                    return res.status(500).json({ error: `Internal server error: ${error}` });
                }
            }
        } catch {
            return res.status(401).send('Invalid token');
        }
    }),
}));
