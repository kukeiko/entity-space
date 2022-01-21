import { BrandReview } from "@entity-space/examples/products/libs/products-model";
import { cloneJson } from "@entity-space/utils";
import { Injectable } from "@nestjs/common";
import data from "./normalized-product-data";

@Injectable()
export class BrandReviewRepository {
    async all(): Promise<BrandReview[]> {
        return cloneJson(data.brandReviews);
    }

    async byBrandIds(ids: number[]): Promise<BrandReview[]> {
        const idSet = new Set(ids);
        const all = await this.all();

        return all.filter(item => idSet.has(item.brandId));
    }
}
