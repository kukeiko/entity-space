import { EntityApi } from "../../lib/execution/entity-api";
import { EntityQueryTracing } from "../../lib/execution/entity-query-tracing";
import { UserBlueprint } from "./common/user.model";
import { BrandBlueprint } from "./products/brand.model";
import { ProductBlueprint } from "./products/product.model";
import { TestContentCatalog } from "./test-content-catalog";
import { TestContentDatabase } from "./test-content-database";

export class TestContentEntityApi extends EntityApi {
    constructor(
        private readonly data: TestContentDatabase,
        private readonly catalog: TestContentCatalog,
        tracing: EntityQueryTracing
    ) {
        super(tracing);
    }

    withGetAllUsers(): this {
        return this.addEndpoint(this.catalog.resolve(UserBlueprint), builder =>
            builder
                .supportsSelection({
                    id: true,
                    name: true,
                    parentId: true,
                })
                .isLoadedBy(() => this.data.get("users"))
        );
    }

    withGetUserById(): this {
        return this.addEndpoint(this.catalog.resolve(UserBlueprint), builder =>
            builder
                .where({ id: Number })
                .supportsSelection({ id: true, name: true, parentId: true })
                .isLoadedBy(({ query }) => {
                    return query.getCriteria().filter(this.data.get("users"));
                })
        );
    }

    withGetBrandById(): this {
        return this.addEndpoint(this.catalog.resolve(BrandBlueprint), builder =>
            builder
                .where({ id: Number })
                .supportsSelection({ id: true, name: true })
                .isLoadedBy(({ query }) => query.getCriteria().filter(this.data.get("brands")))
        );
    }

    withGetAllProducts(): this {
        return this.addEndpoint(this.catalog.resolve(ProductBlueprint), builder =>
            builder
                .supportsDefaultSelection()
                .isLoadedBy(({ query }) => query.getCriteria().filter(this.data.get("products")))
        );
    }
}
