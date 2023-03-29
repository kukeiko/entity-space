import { EntityBlueprintInstance } from "../../../lib/schema/entity-blueprint-instance.type";
import { define } from "../../../lib/schema/entity-blueprint-property";
import { BrandBlueprint } from "./brand.model";
import { ProductReviewBlueprint } from "./product-review.model";

export class ProductBlueprint {
    id = define(Number, { id: true, required: true });
    name = define(String);
    price = define(Number);
    rating = define(Number);
    brandId = define(Number);
    brand = define(BrandBlueprint, { relation: true, from: "brandId", to: "id" });
    reviews = define(ProductReviewBlueprint, { array: true, relation: true, from: "id", to: "productId" });
}

export type Product = EntityBlueprintInstance<ProductBlueprint>;
