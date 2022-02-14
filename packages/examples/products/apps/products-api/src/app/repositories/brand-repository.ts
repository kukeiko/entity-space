import { ExpansionObject } from "@entity-space/core";
import { Brand } from "@entity-space/examples/products/libs/products-model";
import { cloneJson, groupBy } from "@entity-space/utils";
import { Injectable } from "@nestjs/common";
import { BrandReviewRepository } from "./brand-review-repository";
import data from "./normalized-product-data";

@Injectable()
export class BrandRepository {
    constructor(private readonly brandReviewRepository: BrandReviewRepository) {}

    async all(): Promise<Brand[]> {
        return cloneJson(data.brands);
    }

    async byIds(ids: number[]): Promise<Brand[]> {
        const idSet = new Set(ids);
        const all = await this.all();

        return all.filter(item => idSet.has(item.id));
    }

    async expand(brands: Brand[], expand: ExpansionObject<Brand>): Promise<void> {
        if (expand.reviews !== void 0) {
            const brandIds = brands.map(brand => brand.id);
            const reviews = await this.brandReviewRepository.byBrandIds(brandIds);
            const reviewsPerProduct = groupBy(reviews, review => review.brandId);

            for (const brand of brands) {
                brand.reviews = reviewsPerProduct.get(brand.id) ?? [];
            }
        }
    }
}
