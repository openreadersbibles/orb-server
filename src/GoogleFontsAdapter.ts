import path from "path";
import { GitHubFile } from "./GitHubAdapter";
import { Publisher } from "./Publisher";
import axios from "axios";


export class GoogleFontsAdapter {

    public static async getGoogleFonts(family: string, pathPrefix = ''): Promise<GitHubFile[]> {
        try {
            const urls = await this.getFontUrlsForFamiliy(family);
            const promises = urls.map(async (url: string) => {
                const parsedUrl = new URL(url);
                const basename = `${pathPrefix}fonts/${path.basename(parsedUrl.pathname)}`;
                const fileContent = await Publisher.downloadContent(url, 'arraybuffer');
                const ghf: GitHubFile = { path: basename, content: fileContent };
                return ghf;
            });
            return await Promise.all(promises);
        } catch (error) {
            console.error(`Error fetching Google Fonts for family ${family}:`, error);
            return Promise.reject(error);
        }
    }

    private static async getFontUrlsForFamiliy(family: string): Promise<string[]> {
        const secret = process.env.GOOGLE_FONTS_API_SECRET;
        const encFamily = encodeURIComponent(family);
        const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${secret}&family=${encFamily}`;
        const response = await axios.get<string>(url);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json: any = response.data;
        if (!Array.isArray(json.items) || json.items.length < 1) {
            Promise.reject(new Error(`No fonts found for family ${family}`));
        }
        const files = json.items[0].files as Record<string, string>;
        return Object.keys(files).map((key) => files[key]);
    }

}