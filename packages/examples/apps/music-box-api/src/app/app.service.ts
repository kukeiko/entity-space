import { Injectable } from "@nestjs/common";
import { readdir } from "fs/promises";

@Injectable()
export class AppService {
    async getData(): Promise<{ files: string[] }> {
        const files = await readdir("./");
        return { files };
    }
}
