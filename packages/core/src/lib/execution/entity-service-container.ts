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
import { IEntityTools } from "../entity/entity-tools.interface";
import { EntityQueryParametersShape } from "../query/entity-query-shape";
import { EntitySelection } from "../query/entity-selection";
import { EntityBlueprintInstance } from "../schema/entity-blueprint-instance.type";
import { EntitySchemaCatalog } from "../schema/entity-schema-catalog";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityCache } from "./entity-cache";
import { IEntityCache } from "./entity-cache.interface";
import {
    CreateManyEntitiesFn,
    CreateOneEntityFn,
    DeleteManyEntitiesFn,
    DeleteOneEntityFn,
    EntityMutator,
    UpdateManyEntitiesFn,
    UpdateOneEntityFn,
} from "./entity-mutator";
import { EntityQueryTracing } from "./entity-query-tracing";
import { EntityToolbag } from "./entity-toolbag";
import { IEntityToolbag } from "./entity-toolbag.interface";
import { EntityHydrationEndpoint, EntityHydrationResult, EntityHydrator } from "./interceptors/entity-hydrator";
import { EntitySource } from "./interceptors/entity-source";
import { EntitySourceEndpoint, EntitySourceEndpointInvoke } from "./interceptors/entity-source-endpoint";
import { IEntityStreamInterceptor } from "./interceptors/entity-stream-interceptor.interface";

export class EntitySchemaScopedServiceContainer<B> {
    constructor(
        private readonly schema: IEntitySchema<EntityBlueprintInstance<B>>,
        private readonly api: EntitySource,
        private readonly hydrator: EntityHydrator,
        private readonly mutator: EntityMutator<B>
    ) {
        const criteriaTools = new EntityCriteriaTools();
        this.shapeTools = new EntityCriteriaShapeTools({ criteriaTools });
        this.whereEntityTools = new WhereEntityTools(this.shapeTools, criteriaTools);
    }

    private readonly shapeTools: IEntityCriteriaShapeTools;
    private readonly whereEntityTools: WhereEntityTools;

    addSource<S extends WhereEntityShape<EntityBlueprintInstance<B>>>({
        where,
        load,
        select,
        parameters,
        accept,
    }: {
        where?: S | WhereEntityShape<EntityBlueprintInstance<B>>;
        select?: PackedEntitySelection<EntityBlueprintInstance<B>>;
        parameters?: EntityQueryParametersShape;
        accept?: (criterion: ICriterion) => boolean;
        load: EntitySourceEndpointInvoke<
            EntityBlueprintInstance<B>,
            WhereEntityShapeInstance<EntityBlueprintInstance<B>, S>
        >;
    }): this {
        const criterionShape =
            where === undefined
                ? // ? this.shapeTools.any()
                  this.shapeTools.all()
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

    addHydrator<R extends UnpackedEntitySelection<EntityBlueprintInstance<B>>>({
        hydrate,
        select,
        requires,
    }: {
        select: UnpackedEntitySelection<EntityBlueprintInstance<B>>;
        requires: R;
        hydrate: (
            entities: Select<EntityBlueprintInstance<B>, R>[],
            selection: UnpackedEntitySelection<EntityBlueprintInstance<B>>
        ) => EntityHydrationResult<EntityBlueprintInstance<B>>;
    }): this {
        const endpoint: EntityHydrationEndpoint<EntityBlueprintInstance<B>> = {
            hydrates: select,
            requires,
            schema: this.schema as any,
            load(entities, selection) {
                return hydrate(entities as Select<EntityBlueprintInstance<B>, R>[], selection);
            },
        };

        this.hydrator.hydrationEndpoints.push(endpoint);

        return this;
    }

    addMutator(args: {
        createOne?: CreateOneEntityFn<B>;
        createMany?: CreateManyEntitiesFn<B>;
        updateOne?: UpdateOneEntityFn<B>;
        updateMany?: UpdateManyEntitiesFn<B>;
        deleteOne?: DeleteOneEntityFn<B>;
        deleteMany?: DeleteManyEntitiesFn<B>;
    }): this {
        if (args.createOne) {
            this.mutator.setCreateOne(args.createOne);
        }

        if (args.createMany) {
            this.mutator.setCreateMany(args.createMany);
        }

        if (args.updateOne) {
            this.mutator.setUpdateOne(args.updateOne);
        }

        if (args.updateMany) {
            this.mutator.setUpdateMany(args.updateMany);
        }

        if (args.deleteOne) {
            this.mutator.setDeleteOne(args.deleteOne);
        }

        if (args.deleteMany) {
            this.mutator.setDeleteMany(args.deleteMany);
        }

        return this;
    }
}

export class EntityServiceContainer {
    private readonly tracing = new EntityQueryTracing();
    private readonly catalog = new EntitySchemaCatalog();
    private readonly toolbag = new EntityToolbag();
    private readonly cache = new EntityCache(this.toolbag);
    private readonly apis = new Map<string, EntitySource>();
    private readonly hydrators = new Map<string, EntityHydrator>();
    private readonly mutators = new Map<string, EntityMutator>();

    getCatalog(): EntitySchemaCatalog {
        return this.catalog;
    }

    getToolbag(): IEntityToolbag {
        return this.toolbag;
    }

    getEntityTools(): IEntityTools {
        return this.toolbag.getEntityTools();
    }

    getTracing(): EntityQueryTracing {
        return this.tracing;
    }

    getCache(): IEntityCache {
        return this.cache;
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

    getMutatorFor(schema: IEntitySchema): EntityMutator {
        return this.getOrCreateMutator(schema);
    }

    for<B extends Entity>(blueprint: Class<B>): EntitySchemaScopedServiceContainer<B> {
        const schema = this.catalog.resolve(blueprint);
        const api = this.getOrCreateApi(schema);
        const hydrator = this.getOrCreateHydrator(schema);
        const mutator = this.getOrCreateMutator(schema) as EntityMutator<B>;

        return new EntitySchemaScopedServiceContainer<B>(schema, api, hydrator, mutator);
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

    private getOrCreateMutator(schema: IEntitySchema): EntityMutator {
        let mutator = this.mutators.get(schema.getId());

        if (!mutator) {
            mutator = new EntityMutator(schema);
            this.mutators.set(schema.getId(), mutator);
        }

        return mutator;
    }
}
