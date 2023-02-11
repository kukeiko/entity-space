import { EntityCriteriaFactory } from "../../lib/criteria/vnext/entity-criteria-factory";
import { EntityCriteriaShapeFactory } from "../../lib/criteria/vnext/entity-criteria-shape-factory";
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

    private readonly criteriaFactory = new EntityCriteriaFactory();
    private readonly shapeFactory = new EntityCriteriaShapeFactory({ criteriaFactory: this.criteriaFactory });

    withGetAllUsers(): this {
        return this.addEndpoint(this.catalog.resolve(UserBlueprint), builder =>
            builder
                .supportsSelection({
                    id: true,
                    name: true,
                    parentId: true,
                })
                // .isLoadedBy(({ criterion }) => criterion.filter(this.data.get("users")))
                .isLoadedBy(() => this.data.get("users"))
        );
    }

    withGetUserById(): this {
        return this.addEndpoint(this.catalog.resolve(UserBlueprint), builder =>
            builder
                .requiresFields({ id: this.shapeFactory.equals([Number]) })
                .supportsSelection({ id: true, name: true, parentId: true })
                .isLoadedBy(({ criterion }) => criterion.filter(this.data.get("users")))
        );
    }
}
