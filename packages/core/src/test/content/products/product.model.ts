import { EntityBlueprint } from "../../../lib/schema/entity-blueprint";
import { EntityBlueprintInstance } from "../../../lib/schema/entity-blueprint-instance.type";
import { define } from "../../../lib/schema/entity-blueprint-property";
import { DataEntryMetadataBlueprint } from "../common/metadata.model";
import { BrandBlueprint } from "./brand.model";
import { ProductReviewBlueprint } from "./product-review.model";

@EntityBlueprint({ id: "products" })
export class ProductBlueprint {
    id = define(Number, { id: true });
    name = define(String);
    price = define(Number);
    rating = define(Number, { optional: true });
    brandId = define(Number, { index: true });
    brand = define(BrandBlueprint, { optional: true, relation: true, from: "brandId", to: "id" });
    reviews = define(ProductReviewBlueprint, {
        optional: true,
        array: true,
        relation: true,
        from: "id",
        to: "productId",
    });
    metadata = define(DataEntryMetadataBlueprint, {});
}

export type Product = EntityBlueprintInstance<ProductBlueprint>;
