import { ArraySchema, EntitySchema } from "@entity-space/core";

export class ProductsSchemaCatalog {
    constructor() {
        const userSchema = new EntitySchema("user");
        userSchema.setKey("id");
        this.userSchema = userSchema;

        const brandSchema = new EntitySchema("brand");
        brandSchema.setKey("id");
        this.brandSchema = brandSchema;

        const brandReviewSchema = new EntitySchema("brand-review");
        brandReviewSchema.setKey("id");
        brandReviewSchema.addIndex("brandId");
        brandReviewSchema.addIndex("authorId");
        brandReviewSchema.addProperty("author", userSchema);
        brandReviewSchema.addRelation("author", "authorId", "id");
        this.brandReviewSchema = brandReviewSchema;

        brandSchema.addProperty("reviews", new ArraySchema(brandReviewSchema));
        brandSchema.addRelation("reviews", "id", "brandId");

        const productReviewSchema = new EntitySchema("product-review");
        productReviewSchema.setKey("id");
        productReviewSchema.addIndex("productId");
        this.productReviewSchema = productReviewSchema;

        const productSchema = new EntitySchema("product");
        productSchema.setKey("id");
        productSchema.addIndex("brandId");
        productSchema.addProperty("brand", brandSchema);
        productSchema.addRelation("brand", "brandId", "id");
        productSchema.addProperty("reviews", new ArraySchema(productReviewSchema));
        productSchema.addRelation("reviews", "id", "productId");
        this.productSchema = productSchema;
    }

    private readonly productSchema: EntitySchema;
    private readonly productReviewSchema: EntitySchema;
    private readonly brandSchema: EntitySchema;
    private readonly brandReviewSchema: EntitySchema;
    private readonly userSchema: EntitySchema;

    getProductSchema(): EntitySchema {
        return this.productSchema;
    }

    getProductReviewSchema(): EntitySchema {
        return this.productReviewSchema;
    }

    getBrandSchema(): EntitySchema {
        return this.brandSchema;
    }

    getBrandReviewSchema(): EntitySchema {
        return this.brandReviewSchema;
    }

    getUserSchema(): EntitySchema {
        return this.userSchema;
    }
}
