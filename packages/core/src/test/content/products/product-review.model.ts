import { EntityBlueprint } from "../../../lib/schema/entity-blueprint";
import { EntityBlueprintInstance } from "../../../lib/schema/entity-blueprint-instance.type";
import { define } from "../../../lib/schema/entity-blueprint-property";
import { ReviewBlueprint } from "../common/review.model";
import { BrandBlueprint } from "./brand.model";

@EntityBlueprint({ id: "product-reviews" })
export class ProductReviewBlueprint extends ReviewBlueprint {
    productId = define(Number);
    product = define(BrandBlueprint, { optional: true, relation: true, from: "productId", to: "id" });
}

export type ProductReview = EntityBlueprintInstance<ProductReviewBlueprint>;
