import { User } from "@entity-space/examples/libs/products-model";
import { cloneJson } from "@entity-space/utils";
import { Injectable } from "@nestjs/common";
import data from "./normalized-product-data";

@Injectable()
export class UserRepository {
    async all(): Promise<User[]> {
        const users = cloneJson(data.users);

        return users;
    }

    async byIds(ids: number[]): Promise<User[]> {
        const idSet = new Set(ids);
        const all = await this.all();
        const filtered = all.filter(item => idSet.has(item.id));

        return filtered;
    }
}
