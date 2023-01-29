import { BlueprintInstance } from "../../../lib/schema/blueprint-instance";
import { define } from "../../../lib/schema/blueprint-property";
import { ReviewBlueprint } from "../common/review.model";
import { BrandBlueprint } from "./brand.model";

export class ProductReviewBlueprint extends ReviewBlueprint {
    productId = define(Number);
    product = define(BrandBlueprint, { relation: true, from: "productId", to: "id" });
}

export type ProductReview = BlueprintInstance<ProductReviewBlueprint>;
