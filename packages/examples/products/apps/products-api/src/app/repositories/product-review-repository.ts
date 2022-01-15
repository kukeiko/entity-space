import { ProductReview } from "@entity-space/examples/products/libs/products-model";
import { cloneJson } from "@entity-space/utils";
import data from "./normalized-product-data";

export class ProductReviewRepository {
    async all(): Promise<ProductReview[]> {
        return cloneJson(data.reviews);
    }

    async byProductIds(ids: number[]): Promise<ProductReview[]> {
        const idSet = new Set(ids);
        const all = await this.all();

        return all.filter(item => idSet.has(item.productId));
    }
}
