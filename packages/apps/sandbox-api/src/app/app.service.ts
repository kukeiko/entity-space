import { inRange, or } from "@entity-space/core";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
    getData(): { message: string; criteria: string } {
        const criteria = or([inRange(1, 7)]);

        return { message: "Welcome to sandbox-api!", criteria: criteria.toString() };
    }
}
