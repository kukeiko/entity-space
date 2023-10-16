import { Class, isDefined } from "@entity-space/utils";
import { Entity } from "../common/entity.type";
import { PackedEntitySelection } from "../common/packed-entity-selection.type";
import { Select } from "../common/select.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterion } from "../criteria/criterion.interface";
import { EntityCriteriaShapeTools } from "../criteria/entity-criteria-shape-tools";
import { IEntityCriteriaShapeTools } from "../criteria/entity-criteria-shape-tools.interface";
import { EntityCriteriaTools } from "../criteria/entity-criteria-tools";
import { WhereEntityShapeInstance } from "../criteria/where-entity/where-entity-shape-instance.types";
import { WhereEntityShape } from "../criteria/where-entity/where-entity-shape.types";
import { WhereEntityTools } from "../criteria/where-entity/where-entity-tools";
import { IEntityStore } from "../entity/entity-store.interface";
import { InMemoryEntityDatabase } from "../entity/in-memory-entity-database";
import { EntityQueryParametersShape } from "../query/entity-query-shape";
import { EntitySelection } from "../query/entity-selection";
import { EntityBlueprintInstance } from "../schema/entity-blueprint-instance.type";
import { define } from "../schema/entity-blueprint-property";
import { EntitySchemaCatalog } from "../schema/entity-schema-catalog";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityApiEndpoint, EntityApiEndpointInvoke } from "./entity-api-endpoint";
import { EntityQueryTracing } from "./entity-query-tracing";
import { EntityApi } from "./interceptors/entity-api";
import { EntityHydrationEndpoint, EntityHydratorApi, HydrationResult } from "./interceptors/entity-hydrator-api";
import { IEntityStreamInterceptor } from "./interceptors/entity-stream-interceptor.interface";

export class EntitySchemaScopedServicesBuilder<T extends Entity> {
    constructor(
        private readonly services: EntitySpaceServices,
        private readonly schema: IEntitySchema<T>,
        private readonly api: EntityApi,
        private readonly hydrator: EntityHydratorApi
    ) {
        const criteriaTools = new EntityCriteriaTools();
        this.shapeTools = new EntityCriteriaShapeTools({ criteriaTools });
        this.whereEntityTools = new WhereEntityTools(this.shapeTools, criteriaTools);
    }

    private readonly shapeTools: IEntityCriteriaShapeTools;
    private readonly whereEntityTools: WhereEntityTools;

    addSource<S extends WhereEntityShape<T>>({
        where,
        load,
        select,
        parameters,
        accept,
    }: {
        where?: S | WhereEntityShape<T>;
        select?: PackedEntitySelection<T>;
        parameters?: EntityQueryParametersShape;
        accept?: (criterion: ICriterion) => boolean;
        load: EntityApiEndpointInvoke<T, WhereEntityShapeInstance<T, S>>;
    }): this {
        const criterionShape =
            where === undefined
                ? this.shapeTools.any()
                : this.whereEntityTools.toCriterionShapeFromWhereEntityShape(where, this.schema);

        const unpackedSelect = EntitySelection.unpack(this.schema, select ?? {});

        const endpoint = new EntityApiEndpoint({
            selection: new EntitySelection({ schema: this.schema, value: unpackedSelect }),
            criterionShape,
            schema: this.schema,
            invoke: load as any,
            whereEntityShape: where,
            parametersShape: parameters,
            acceptCriterion: accept,
        });

        this.api.addEndpoint(endpoint);

        return this;
    }

    addHydrator<R extends UnpackedEntitySelection<T>>({
        hydrate,
        select,
        requires,
    }: {
        select: UnpackedEntitySelection<T>;
        requires: R;
        hydrate: (entities: Select<T, R>[], selection: UnpackedEntitySelection<T>) => HydrationResult<T>;
    }): this {
        const endpoint: EntityHydrationEndpoint<T> = {
            hydrates: select,
            requires,
            schema: this.schema,
            load(entities, selection) {
                return hydrate(entities as Select<T, R>[], selection);
            },
        };

        this.hydrator.hydrationEndpoints.push(endpoint);

        return this;
    }
}

export class EntitySpaceServices {
    private readonly tracing = new EntityQueryTracing();
    private readonly catalog = new EntitySchemaCatalog();
    private readonly database = new InMemoryEntityDatabase();
    private readonly sources: IEntityStreamInterceptor[] = [];
    private readonly hydratorInterceptors: IEntityStreamInterceptor[] = [];
    private readonly stores: IEntityStore[] = [];
    private readonly apis = new Map<string, EntityApi>();
    private readonly hydrators = new Map<string, EntityHydratorApi>();

    getCatalog(): EntitySchemaCatalog {
        return this.catalog;
    }

    getTracing(): EntityQueryTracing {
        return this.tracing;
    }

    getDatabase(): InMemoryEntityDatabase {
        return this.database;
    }

    pushSource(source: IEntityStreamInterceptor): this {
        this.sources.push(source);
        return this;
    }

    getSources(): IEntityStreamInterceptor[] {
        return [...this.apis.values(), ...this.sources];
    }

    getSourcesFor(schema: IEntitySchema): IEntityStreamInterceptor[] {
        return [this.apis.get(schema.getId())].filter(isDefined);
    }

    pushHydrator(source: IEntityStreamInterceptor): this {
        this.hydratorInterceptors.push(source);
        return this;
    }

    getHydrators(): IEntityStreamInterceptor[] {
        return [...this.hydrators.values(), ...this.hydratorInterceptors];
    }

    getHydratorsFor(schema: IEntitySchema): IEntityStreamInterceptor[] {
        return [this.hydrators.get(schema.getId())].filter(isDefined);
    }

    pushStore(store: IEntityStore): this {
        this.stores.push(store);
        return this;
    }

    getStores(): IEntityStore[] {
        return this.stores.slice();
    }

    for<T extends Entity>(blueprint: Class<T>) {
        const schema = this.catalog.resolve(blueprint);
        const api = this.getOrCreateApi(schema);
        const hydrator = this.getOrCreateHydrator(schema);

        return new EntitySchemaScopedServicesBuilder(this, schema, api, hydrator);
    }

    addHydratorFor_v2<T, R extends UnpackedEntitySelection<EntityBlueprintInstance<T>>>(
        type: Class<T>,
        opts: {
            requires: R;
        },
        hydrate: (entities: Select<EntityBlueprintInstance<T>, R>[]) => any
    ): any {}

    test() {
        class Foo {
            id = define(String);
            name = define(String);
        }

        this.addHydratorFor_v2(Foo, { requires: { id: true } }, entities => {
            entities[0].id;
        });

        // this.addHydratorFor(Foo).requires({ id: true }).hydrates({ name: true }).executes();
    }

    private getOrCreateApi(schema: IEntitySchema): EntityApi {
        let api = this.apis.get(schema.getId());

        if (!api) {
            api = new EntityApi(this);
            this.apis.set(schema.getId(), api);
        }

        return api;
    }

    private getOrCreateHydrator(schema: IEntitySchema): EntityHydratorApi {
        let hydrator = this.hydrators.get(schema.getId());

        if (!hydrator) {
            hydrator = new EntityHydratorApi(this);
            this.hydrators.set(schema.getId(), hydrator);
        }

        return hydrator;
    }
}
