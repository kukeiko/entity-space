import { EntityApi } from "../../lib/execution/entity-api";
import { EntityQueryTracing } from "../../lib/execution/entity-query-tracing";
import { UserBlueprint } from "./common/user.model";
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
                .isLoadedBy(({ query }) => query.getCriteria().filter(this.data.get("users")))
        );
    }
}
