import { EntityApi } from "@entity-space/core";
import { EntityQueryTracing } from "../../lib/tracing/entity-query-tracing";
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
                .supportsExpansion({
                    id: true,
                    name: true,
                    parentId: true,
                })
                .isLoadedBy(({ criterion }) => criterion.filter(this.data.get("users")))
        );
    }
}
