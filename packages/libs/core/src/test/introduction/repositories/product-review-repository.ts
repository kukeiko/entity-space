import { ProductReview } from "../model";
import data from "../data/normalized-product-data";
import { cloneJson } from "../utils";

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
