import { EntityBlueprint } from "../../../lib/schema/entity-blueprint";
import { EntityBlueprintInstance } from "../../../lib/schema/entity-blueprint-instance.type";
import { define } from "../../../lib/schema/entity-blueprint-property";
import { DataEntryMetadataBlueprint } from "../common/metadata.model";
import { BrandBlueprint } from "./brand.model";
import { ProductReviewBlueprint } from "./product-review.model";

@EntityBlueprint({ id: "products" })
export class ProductBlueprint {
    id = define(Number, { id: true, required: true });
    name = define(String, { required: true });
    price = define(Number, { required: true });
    rating = define(Number);
    brandId = define(Number, { required: true, index: true });
    brand = define(BrandBlueprint, { relation: true, from: "brandId", to: "id" });
    reviews = define(ProductReviewBlueprint, { array: true, relation: true, from: "id", to: "productId" });
    metadata = define(DataEntryMetadataBlueprint, { required: true });
}

export type Product = EntityBlueprintInstance<ProductBlueprint>;
