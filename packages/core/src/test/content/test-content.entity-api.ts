import { EntitySpaceServices } from "../../lib/execution/entity-space-services";
import { EntityApi } from "../../lib/execution/interceptors/entity-api";
import { UserBlueprint } from "./common/user.model";
import { BrandBlueprint } from "./products/brand.model";
import { ProductBlueprint } from "./products/product.model";
import { TestContentDatabase } from "./test-content-database";

export class TestContentEntityApi extends EntityApi {
    constructor(private readonly data: TestContentDatabase, services: EntitySpaceServices) {
        super(services);
    }

    withGetAllUsers(): this {
        return this.addEndpoint(this.services.getCatalog().resolve(UserBlueprint), builder =>
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
        return this.addEndpoint(this.services.getCatalog().resolve(UserBlueprint), builder =>
            builder
                .where({ id: Number })
                .supportsSelection({ id: true, name: true, parentId: true })
                .isLoadedBy(({ query }) => {
                    return query.getCriteria().filter(this.data.get("users"));
                })
        );
    }

    withGetBrandById(): this {
        return this.addEndpoint(this.services.getCatalog().resolve(BrandBlueprint), builder =>
            builder
                .where({ id: Number })
                .supportsDefaultSelection()
                .isLoadedBy(({ query }) => query.getCriteria().filter(this.data.get("brands")))
        );
    }

    withGetAllProducts(): this {
        return this.addEndpoint(this.services.getCatalog().resolve(ProductBlueprint), builder =>
            builder
                .supportsDefaultSelection()
                .isLoadedBy(({ query }) => query.getCriteria().filter(this.data.get("products")))
        );
    }
}
