import { BlueprintInstance } from "../../../lib/common/schema/blueprint-instance";
import { define } from "../../../lib/common/schema/blueprint-property";
import { ReviewBlueprint } from "../common/review.model";
import { BrandBlueprint } from "./brand.model";

export class ProductReviewBlueprint extends ReviewBlueprint {
    productId = define(Number);
    product = define(BrandBlueprint, { relation: true, from: "productId", to: "id" });
}

export type ProductReview = BlueprintInstance<ProductReviewBlueprint>;
