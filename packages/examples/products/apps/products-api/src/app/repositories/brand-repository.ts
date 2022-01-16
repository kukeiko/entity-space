import { Brand } from "@entity-space/examples/products/libs/products-model";
import { cloneJson } from "@entity-space/utils";
import { Injectable } from "@nestjs/common";
import data from "./normalized-product-data";

@Injectable()
export class BrandRepository {
    async all(): Promise<Brand[]> {
        return cloneJson(data.brands);
    }

    async byIds(ids: number[]): Promise<Brand[]> {
        const idSet = new Set(ids);
        const all = await this.all();

        return all.filter(item => idSet.has(item.id));
    }
}
