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
import { InMemoryEntityDatabase } from "./in-memory-entity-database";
import { EntityQueryParametersShape } from "../query/entity-query-shape";
import { EntitySelection } from "../query/entity-selection";
import { EntitySchemaCatalog } from "../schema/entity-schema-catalog";
import { IEntitySchema } from "../schema/schema.interface";
import { EntitySourceEndpoint, EntitySourceEndpointInvoke } from "./interceptors/entity-source-endpoint";
import { EntityQueryTracing } from "./entity-query-tracing";
import { EntitySource } from "./interceptors/entity-source";
import { EntityHydrationEndpoint, EntityHydrator, EntityHydrationResult } from "./interceptors/entity-hydrator";
import { IEntityStreamInterceptor } from "./interceptors/entity-stream-interceptor.interface";

export class EntitySchemaScopedServiceContainer<T extends Entity> {
    constructor(
        private readonly schema: IEntitySchema<T>,
        private readonly api: EntitySource,
        private readonly hydrator: EntityHydrator
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
        load: EntitySourceEndpointInvoke<T, WhereEntityShapeInstance<T, S>>;
    }): this {
        const criterionShape =
            where === undefined
                ? this.shapeTools.any()
                : this.whereEntityTools.toCriterionShapeFromWhereEntityShape(where, this.schema);

        const unpackedSelect = EntitySelection.unpack(this.schema, select ?? {});

        const endpoint = new EntitySourceEndpoint({
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
        hydrate: (entities: Select<T, R>[], selection: UnpackedEntitySelection<T>) => EntityHydrationResult<T>;
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

export class EntityServiceContainer {
    private readonly tracing = new EntityQueryTracing();
    private readonly catalog = new EntitySchemaCatalog();
    private readonly database = new InMemoryEntityDatabase();
    private readonly stores: IEntityStore[] = [];
    private readonly apis = new Map<string, EntitySource>();
    private readonly hydrators = new Map<string, EntityHydrator>();

    getCatalog(): EntitySchemaCatalog {
        return this.catalog;
    }

    getTracing(): EntityQueryTracing {
        return this.tracing;
    }

    getDatabase(): InMemoryEntityDatabase {
        return this.database;
    }

    getSources(): IEntityStreamInterceptor[] {
        return Array.from(this.apis.values());
    }

    getSourcesFor(schema: IEntitySchema): IEntityStreamInterceptor[] {
        return [this.apis.get(schema.getId())].filter(isDefined);
    }

    getHydrators(): IEntityStreamInterceptor[] {
        return Array.from(this.hydrators.values());
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

        return new EntitySchemaScopedServiceContainer(schema, api, hydrator);
    }

    private getOrCreateApi(schema: IEntitySchema): EntitySource {
        let api = this.apis.get(schema.getId());

        if (!api) {
            api = new EntitySource(this);
            this.apis.set(schema.getId(), api);
        }

        return api;
    }

    private getOrCreateHydrator(schema: IEntitySchema): EntityHydrator {
        let hydrator = this.hydrators.get(schema.getId());

        if (!hydrator) {
            hydrator = new EntityHydrator(this);
            this.hydrators.set(schema.getId(), hydrator);
        }

        return hydrator;
    }
}
