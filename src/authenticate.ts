import axios from "axios";
import { CognitoUserInfoResponse } from "../../models/TimedOauthCredentials";
import { COGNITO } from "../cognito";

export async function authenticate(token: string): Promise<CognitoUserInfoResponse> {
    try {
        const headers = {
            'Authorization': `Bearer ${token}`
        };
        const response = await axios.get(`${COGNITO.auth_url}/oauth2/userInfo`, { headers });
        return response.data as CognitoUserInfoResponse;
    } catch (error) {
        return Promise.reject(error);
    }
}
