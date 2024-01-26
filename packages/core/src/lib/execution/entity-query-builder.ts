import { Class, getInstanceClass, isNotFalse } from "@entity-space/utils";
import { flatten } from "lodash";
import { filter, from, lastValueFrom, map, merge, mergeAll, mergeMap, Observable, of } from "rxjs";
import { Entity } from "../common/entity.type";
import { PackedEntitySelection } from "../common/packed-entity-selection.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterion } from "../criteria/criterion.interface";
import { EntityCriteriaShapeTools } from "../criteria/entity-criteria-shape-tools";
import { EntityCriteriaTools } from "../criteria/entity-criteria-tools";
import { EntityWhere } from "../criteria/entity-criteria-tools.interface";
import { WhereEntityTools } from "../criteria/where-entity/where-entity-tools";
import { WhereEntitySingle } from "../criteria/where-entity/where-entity.types";
import { EntitySet } from "../entity/entity-set";
import { EntityQueryTools } from "../query/entity-query-tools";
import { IEntityQueryTools } from "../query/entity-query-tools.interface";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntitySelection } from "../query/entity-selection";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityServiceContainer } from "./entity-service-container";
import { EntityStream } from "./entity-stream";
import { EntityStreamPacket } from "./entity-stream-packet";
import { IEntityStreamInterceptor } from "./interceptors/entity-stream-interceptor.interface";
import { LoadFromCacheInterceptor } from "./interceptors/load-from-cache.interceptor";
import { EntityRelationHydrator } from "./interceptors/entity-relation-hydrator";
import { runInterceptors } from "./run-interceptors.fn";

export interface EntityQueryBuilderPatch<T extends Entity> {
    selection?: UnpackedEntitySelection<T>;
    criteria?: ICriterion;
    parameters?: Entity;
    cache?: EntityCacheInvalidationOptions;
}

export interface EntityQueryBuilderCreate<T extends Entity> extends EntityQueryBuilderPatch<T> {
    context: EntityServiceContainer;
    schema: IEntitySchema<T>;
}

export interface EntityCacheInvalidationOptions {
    blueprints: Class[];
}

export class EntityQueryBuilder<T extends Entity = Entity> implements IEntityStreamInterceptor {
    constructor(args: EntityQueryBuilderCreate<T>) {
        this.createArgs = args;
        this.services = args.context;
        this.schema = args.schema;
        this.selection = args.selection ?? args.schema.getDefaultSelection();
        this.criteria = args.criteria ?? new EntityCriteriaTools().all();
        this.parameters = args.parameters;
        this.criteriaTools = new EntityCriteriaTools();
        this.shapeTools = new EntityCriteriaShapeTools({ criteriaTools: this.criteriaTools });
        this.whereEntityTools = new WhereEntityTools(this.shapeTools, this.criteriaTools);
        this.queryTools = new EntityQueryTools({ criteriaTools: this.criteriaTools });
        this.cacheOptions = args.cache;
    }

    private readonly services: EntityServiceContainer;
    private readonly createArgs: EntityQueryBuilderCreate<T>;
    private readonly schema: IEntitySchema<T>;
    private readonly selection: UnpackedEntitySelection<T>;
    private readonly criteria: ICriterion;
    private readonly parameters?: Entity;
    private readonly criteriaTools: EntityCriteriaTools;
    private readonly shapeTools: EntityCriteriaShapeTools;
    private readonly whereEntityTools: WhereEntityTools;
    private readonly queryTools: IEntityQueryTools;
    private readonly cacheOptions?: EntityCacheInvalidationOptions;

    getName(): string {
        return EntityQueryBuilder.name;
    }

    copy(patch?: EntityQueryBuilderPatch<T>): this {
        return new (getInstanceClass(this))({ ...this.createArgs, ...(patch ?? {}) });
    }

    select(selection: PackedEntitySelection<T>): this {
        const unpacked = EntitySelection.unpack(this.schema, selection);
        const merged = EntitySelection.mergeValues(this.selection, unpacked);

        return this.copy({ selection: merged });
    }

    // [todo] currently replaces any previously set criteria, should instead allow combining them with and/or
    where(criteria: WhereEntitySingle<T>): this {
        const criterion = this.whereEntityTools.toCriterionFromWhereEntitySingle(this.schema, criteria);
        const simplified = criterion.simplify();

        return this.copy({ criteria: simplified });
    }

    using(parameters: Entity): this {
        return this.copy({ parameters });
    }

    invalidateCache(cache: EntityCacheInvalidationOptions): this {
        return this.copy({ cache });
    }

    findAll(): Observable<{ entities: T[] }> {
        return this.query$(this.schema, this.criteria, this.selection, this.parameters).pipe(
            map(entities => ({ entities }))
        );
    }

    findOne(): Observable<{ entity: T | undefined }> {
        return this.query$(this.schema, this.criteria, this.selection, this.parameters).pipe(
            map(entities => ({ entity: entities[0] }))
        );
    }

    private query$<T extends Entity>(
        schema: IEntitySchema<T>,
        criterion: ICriterion | EntityWhere<T> = this.criteriaTools.all(),
        selection?: UnpackedEntitySelection<T>,
        parameters?: Entity
    ): Observable<T[]> {
        if (!this.criteriaTools.isCriterion(criterion)) {
            criterion = this.criteriaTools.where(criterion);
        }

        const query = this.queryTools.createQuery({
            entitySchema: schema,
            // [todo] type assertion
            criteria: criterion as ICriterion,
            selection: selection,
            parameters,
        });

        this.services.getTracing().querySpawned(query);

        return from(this.query<T>(query)).pipe(
            map(results => {
                if (!results) {
                    return [];
                }

                return flatten(results.map(entitySet => entitySet.getEntities()));
            })
        );
    }

    private async query<T extends Entity = Entity>(query: IEntityQuery): Promise<false | EntitySet<T>[]> {
        if (this.cacheOptions) {
            this.cacheOptions.blueprints.forEach(blueprint => {
                this.services.getDatabase().clearBySchema(this.services.getCatalog().resolve(blueprint));
            });
        }

        const sources = [
            // new LoadFromCacheInterceptor(this.services.getDatabase(), this.services.getTracing()),
            // new LogPacketsInterceptor(true),
            ...this.services.getSourcesFor(query.getEntitySchema()),
            ...this.services.getHydratorsFor(query.getEntitySchema()),
            // [todo] copying to prevent clearing cache more than once. not the best way to do it. a problem for future me!
            new EntityRelationHydrator(this.services, [this.copy({ cache: undefined })]),
        ];

        await lastValueFrom(runInterceptors(sources, query, this.services.getTracing()));

        const entities = this.services.getDatabase().querySync(query).getEntities() as T[];
        this.services
            .getTracing()
            .queryResolved(query, `${entities.length}x entit${entities.length === 1 ? "y" : "ies"}`);

        return [new EntitySet({ query, entities })];
    }

    intercept(stream: EntityStream<Entity>): EntityStream<Entity> {
        return merge(
            stream.pipe(map(EntityStreamPacket.withoutRejected), filter(EntityStreamPacket.isNotEmpty)),
            stream.pipe(
                map(EntityStreamPacket.withOnlyRejected),
                filter(EntityStreamPacket.isNotEmpty),
                mergeMap(packet =>
                    merge(...packet.getRejectedQueries().map(query => this.query(query))).pipe(
                        filter(isNotFalse),
                        map(payload =>
                            of(
                                // [todo] rejections from this.query() are not forwarded
                                new EntityStreamPacket({
                                    payload,
                                    accepted: payload.map(set => set.getQuery()),
                                    delivered: payload.map(set => set.getQuery()),
                                })
                            )
                        )
                    )
                ),
                mergeAll()
            )
        );
    }
}
