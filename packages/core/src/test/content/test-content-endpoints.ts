import { EntityServiceContainer } from "../../lib/execution/entity-service-container";
import { UserBlueprint } from "./common/user.model";
import { BrandBlueprint } from "./products/brand.model";
import { ProductBlueprint } from "./products/product.model";
import { TestContentDatabase } from "./test-content-database";

export class TestContentEndpoints {
    constructor(private readonly database: TestContentDatabase, private readonly services: EntityServiceContainer) {}

    withGetAllUsers(): this {
        this.services.for(UserBlueprint).addSource({
            select: {
                id: true,
                name: true,
                parentId: true,
            },
            load: () => this.database.get("users"),
        });

        return this;
    }

    withGetUserById(): this {
        this.services.for(UserBlueprint).addSource({
            where: { id: Number },
            select: { id: true, name: true, parentId: true },
            load: ({ query }) => query.getCriteria().filter(this.database.get("users")),
        });

        return this;
    }

    withGetBrandById(): this {
        this.services.for(BrandBlueprint).addSource({
            where: { id: Number },
            select: {
                id: true,
                name: true,
                metadata: { createdAt: true, createdById: true, updatedAt: true, updatedById: true },
            },
            load: ({ query }) => query.getCriteria().filter(this.database.get("brands")),
        });

        return this;
    }

    withGetAllProducts(): this {
        this.services.for(ProductBlueprint).addSource({
            select: {
                id: true,
                name: true,
                price: true,
                brandId: true,
                metadata: { createdAt: true, createdById: true, updatedAt: true, updatedById: true },
            },
            load: ({ query }) => query.getCriteria().filter(this.database.get("products")),
        });

        return this;
    }
}
