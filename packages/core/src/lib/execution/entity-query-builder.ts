import { getInstanceClass, isNotFalse } from "@entity-space/utils";
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
import { EntitySet } from "../entity/data-structures/entity-set";
import { EntityQueryTools } from "../query/entity-query-tools";
import { IEntityQueryTools } from "../query/entity-query-tools.interface";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntitySelection } from "../query/entity-selection";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityStream } from "./entity-stream";
import { EntityStreamPacket } from "./entity-stream-packet";
import { EntityWorkspaceContext } from "./entity-workspace-context";
import { IEntityStreamInterceptor } from "./interceptors/entity-stream-interceptor.interface";
import { LoadFromCacheInterceptor } from "./interceptors/load-from-cache.interceptor";
import { LogPacketsInterceptor } from "./interceptors/log-packets.interceptor";
import { SchemaRelationBasedHydrator } from "./interceptors/schema-relation-based-hydrator";
import { WriteToCacheInterceptor } from "./interceptors/write-to-cache.interceptor";
import { runInterceptors } from "./run-interceptors.fn";

export interface EntityQueryBuilderPatch<T extends Entity> {
    selection?: UnpackedEntitySelection<T>;
    criteria?: ICriterion;
    parameters?: Entity;
}

export interface EntityQueryBuilderCreate<T extends Entity> extends EntityQueryBuilderPatch<T> {
    context: EntityWorkspaceContext;
    schema: IEntitySchema<T>;
}

export class EntityQueryBuilder<T extends Entity = Entity> implements IEntityStreamInterceptor {
    constructor(args: EntityQueryBuilderCreate<T>) {
        this.createArgs = args;
        this.context = args.context;
        this.schema = args.schema;
        this.selection = args.selection ?? args.schema.getDefaultSelection();
        this.criteria = args.criteria ?? new EntityCriteriaTools().all();
        this.parameters = args.parameters;
        this.criteriaTools = new EntityCriteriaTools();
        this.shapeTools = new EntityCriteriaShapeTools({ criteriaTools: this.criteriaTools });
        this.whereEntityTools = new WhereEntityTools(this.shapeTools, this.criteriaTools);
        this.queryTools = new EntityQueryTools({ criteriaTools: this.criteriaTools });
    }

    private readonly context: EntityWorkspaceContext;
    private readonly createArgs: EntityQueryBuilderCreate<T>;
    private readonly schema: IEntitySchema<T>;
    private readonly selection: UnpackedEntitySelection<T>;
    private readonly criteria: ICriterion;
    private readonly parameters?: Entity;
    private readonly criteriaTools: EntityCriteriaTools;
    private readonly shapeTools: EntityCriteriaShapeTools;
    private readonly whereEntityTools: WhereEntityTools;
    private readonly queryTools: IEntityQueryTools;

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

        this.context.getTracing().querySpawned(query);

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
        const sources = [
            new LoadFromCacheInterceptor(this.context.getDatabase(), this.context.getTracing()),
            ...this.context.getSources(),
            // new LogPacketsInterceptor(true),
            ...this.context.getHydrators(),
            new SchemaRelationBasedHydrator(this.context.getTracing(), [this]),
            new WriteToCacheInterceptor(this.context.getDatabase()),
        ];

        await lastValueFrom(runInterceptors(sources, [query]));

        const entities = this.context.getDatabase().querySync(query).getEntities() as T[];
        this.context
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
                        map(payload => of(new EntityStreamPacket({ payload })))
                    )
                ),
                mergeAll()
            )
        );
    }
}
