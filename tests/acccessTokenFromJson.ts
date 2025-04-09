import untyped_tokens from "./tokens/access-tokens.json";

type Tokens = { [key: string]: string };
const tokens = untyped_tokens as Tokens;

export function accessTokenFromJson(username: string): string {
    const token = tokens[username] || "";
    // if (!token) {
    //     throw new Error(`No token found for user: ${username}`);
    // }
    return token;
}
