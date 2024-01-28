import { Class } from "@entity-space/utils";
import { Observable, filter, from, lastValueFrom, map, merge, mergeAll, mergeMap, of } from "rxjs";
import { Entity } from "../common/entity.type";
import { PackedEntitySelection } from "../common/packed-entity-selection.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterion } from "../criteria/criterion.interface";
import { WhereEntityTools } from "../criteria/where-entity/where-entity-tools";
import { WhereEntitySingle } from "../criteria/where-entity/where-entity.types";
import { EntitySet } from "../entity/entity-set";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntitySelection } from "../query/entity-selection";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityServiceContainer } from "./entity-service-container";
import { EntityStream } from "./entity-stream";
import { EntityStreamPacket } from "./entity-stream-packet";
import { EntityRelationHydrator } from "./interceptors/entity-relation-hydrator";
import { IEntityStreamInterceptor } from "./interceptors/entity-stream-interceptor.interface";
import { LogPacketsInterceptor } from "./interceptors/log-packets.interceptor";
import { MergePacketsTakeLastInterceptor } from "./interceptors/merge-packets-take-last.interceptor";
import { runInterceptors } from "./run-interceptors.fn";

export interface EntityCacheInvalidationOptions {
    blueprints: Class[];
}

export interface QueryArguments<T> {
    select?: PackedEntitySelection<T>;
    where?: WhereEntitySingle<T>;
    parameters?: Entity;
    invalidateCache?: EntityCacheInvalidationOptions;
}

export class EntityQueryExecutor<T extends Entity = Entity> implements IEntityStreamInterceptor {
    constructor(private readonly schema: IEntitySchema<T>, private readonly services: EntityServiceContainer) {}

    private readonly criteriaTools = this.services.getToolbag().getCriteriaTools();
    private readonly shapeTools = this.services.getToolbag().getCriteriaShapeTools();
    private readonly whereEntityTools = new WhereEntityTools(this.shapeTools, this.criteriaTools);
    private readonly queryTools = this.services.getToolbag().getQueryTools();
    private logPackets = false;

    enablePacketLogging(flag = true): this {
        this.logPackets = flag;
        return this;
    }

    getName(): string {
        return EntityQueryExecutor.name;
    }

    findAll$(args?: Omit<QueryArguments<T>, "where">): Observable<T[]> {
        return from(this.findAll(args));
    }

    findMany$(args?: QueryArguments<T>): Observable<T[]> {
        return from(this.findMany(args));
    }

    findOne$(args?: QueryArguments<T>): Observable<T | undefined> {
        return from(this.findOne(args));
    }

    async findOne(args?: QueryArguments<T>): Promise<T | undefined> {
        const criterion =
            args?.where === undefined
                ? this.criteriaTools.all()
                : this.whereEntityTools.toCriterionFromWhereEntitySingle(this.schema, args.where).simplify();
        const select = EntitySelection.unpack(this.schema, args?.select ?? {});
        const entities = await this.issueQuery(criterion, select, args?.parameters, args?.invalidateCache);

        return entities[0];
    }

    findMany(args?: QueryArguments<T>): Promise<T[]> {
        const criterion =
            args?.where === undefined
                ? this.criteriaTools.all()
                : this.whereEntityTools.toCriterionFromWhereEntitySingle(this.schema, args.where).simplify();
        const select = EntitySelection.unpack(this.schema, args?.select ?? {});

        return this.issueQuery(criterion, select, args?.parameters, args?.invalidateCache);
    }

    findAll(args?: Omit<QueryArguments<T>, "where">): Promise<T[]> {
        const criterion = this.criteriaTools.all();
        const select = EntitySelection.unpack(this.schema, args?.select ?? {});

        return this.issueQuery(criterion, select, args?.parameters, args?.invalidateCache);
    }

    private async issueQuery<T extends Entity>(
        criteria: ICriterion = this.criteriaTools.all(),
        selection?: UnpackedEntitySelection<T>,
        parameters?: Entity,
        invalidateCache?: EntityCacheInvalidationOptions
    ): Promise<T[]> {
        if (invalidateCache) {
            invalidateCache.blueprints.forEach(blueprint => {
                this.services.getCache().clearBySchema(this.services.getCatalog().resolve(blueprint));
            });
        }

        const query = this.queryTools.createQuery({ entitySchema: this.schema, criteria, selection, parameters });
        this.services.getTracing().querySpawned(query);
        const entitySet = await this.query<T>(query);

        return entitySet.getEntities();
    }

    private async query<T extends Entity = Entity>(query: IEntityQuery): Promise<EntitySet<T>> {
        const packet = await this.queryAsPacket<T>(query);
        const entities = packet.getEntitiesFlat();
        this.services
            .getTracing()
            .queryResolved(query, `${entities.length}x entit${entities.length === 1 ? "y" : "ies"}`);

        return new EntitySet({ query, entities: packet.getEntitiesFlat() });
    }

    // [todo] still needed for TestContentFacade
    async queryAsPacket<T extends Entity = Entity>(query: IEntityQuery): Promise<EntityStreamPacket<T>> {
        const sources = [
            ...this.services.getSourcesFor(query.getEntitySchema()),
            new LogPacketsInterceptor({ logEach: this.logPackets }),
            ...this.services.getHydratorsFor(query.getEntitySchema()),
            new LogPacketsInterceptor({ logEach: this.logPackets }),
            new EntityRelationHydrator(this.services, [this]),
            new LogPacketsInterceptor({ logEach: this.logPackets }),
            new MergePacketsTakeLastInterceptor(this.services.getToolbag()),
            new LogPacketsInterceptor(this.logPackets),
        ];

        const packet = await lastValueFrom(runInterceptors(sources, query, this.services.getTracing()));

        if (packet.getErrors().length) {
            throw new Error(
                packet
                    .getErrors()
                    .map(error => error.getErrorMessage())
                    .join(", ")
            );
        }

        return packet as EntityStreamPacket<T>;
    }

    intercept(stream: EntityStream<Entity>): EntityStream<Entity> {
        return merge(
            stream.pipe(map(EntityStreamPacket.withoutRejected), filter(EntityStreamPacket.isNotEmpty)),
            stream.pipe(
                map(EntityStreamPacket.withOnlyRejected),
                filter(EntityStreamPacket.isNotEmpty),
                mergeMap(packet =>
                    merge(...packet.getRejectedQueries().map(query => from(this.query(query)))).pipe(
                        map(payload =>
                            of(
                                // [todo] rejections from this.query() are not forwarded
                                new EntityStreamPacket({
                                    payload: [payload],
                                    accepted: [payload.getQuery()],
                                    delivered: [payload.getQuery()],
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
