import { Product, ProductFilter } from "../model";
import data from "../data/normalized-product-data";
import { cloneJson } from "../utils";

export class ProductRepository {
    async all(): Promise<Product[]> {
        return cloneJson(data.products);
    }

    async filter(filter: ProductFilter): Promise<Product[]> {
        const all = await this.all();

        return all.filter(item => {
            if (filter.minPrice !== void 0 && item.price < filter.minPrice) return false;
            if (filter.maxPrice !== void 0 && item.price > filter.maxPrice) return false;
            if (filter.minRating !== void 0 && item.rating < filter.minRating) return false;
            if (filter.maxRating !== void 0 && item.rating > filter.maxRating) return false;

            return true;
        });
    }

    async byIds(ids: number[]): Promise<Product[]> {
        const idSet = new Set(ids);
        const all = await this.all();

        return all.filter(item => idSet.has(item.id));
    }
}
