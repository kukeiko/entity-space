import { Expansion } from "@entity-space/core";
import { Product, ProductFilter } from "@entity-space/examples/products/libs/products-model";
import { cloneJson, groupBy } from "@entity-space/utils";
import { Injectable } from "@nestjs/common";
import data from "./normalized-product-data";
import { ProductReviewRepository } from "./product-review-repository";

@Injectable()
export class ProductRepository {
    constructor(private readonly productReviewRepository: ProductReviewRepository) {}

    async all(expand?: Expansion): Promise<Product[]> {
        const products = cloneJson(data.products);

        if (expand !== void 0) {
            await this.expand(products, expand);
        }

        return products;
    }

    async byIds(ids: number[], expand?: Expansion): Promise<Product[]> {
        const idSet = new Set(ids);
        const all = await this.all();
        const filtered = all.filter(item => idSet.has(item.id));

        if (expand !== void 0) {
            await this.expand(filtered, expand);
        }

        return filtered;
    }

    async search(filter: ProductFilter, expand?: Expansion<Product>): Promise<Product[]> {
        const all = await this.all();

        const filtered = all.filter(item => {
            if (filter.minPrice !== void 0 && item.price < filter.minPrice) return false;
            if (filter.maxPrice !== void 0 && item.price > filter.maxPrice) return false;
            if (filter.minRating !== void 0 && item.rating < filter.minRating) return false;
            if (filter.maxRating !== void 0 && item.rating > filter.maxRating) return false;

            return true;
        });

        if (expand !== void 0) {
            await this.expand(filtered, expand);
        }

        return filtered;
    }

    async expand(products: Product[], expand: Expansion<Product>): Promise<void> {
        if (expand.reviews !== void 0) {
            const productIds = products.map(product => product.id);
            const reviews = await this.productReviewRepository.byProductIds(productIds);
            const reviewsPerProduct = groupBy(reviews, review => review.productId);

            for (const product of products) {
                product.reviews = reviewsPerProduct.get(product.id) ?? [];
            }
        }
    }
}
