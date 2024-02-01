import { Class } from "@entity-space/utils";
import {
    Observable,
    concat,
    delay,
    filter,
    lastValueFrom,
    map,
    merge,
    mergeAll,
    of,
    switchMap,
    takeLast,
    tap,
} from "rxjs";
import { Entity } from "../common/entity.type";
import { PackedEntitySelection } from "../common/packed-entity-selection.type";
import { WhereEntityTools } from "../criteria/where-entity/where-entity-tools";
import { WhereEntitySingle } from "../criteria/where-entity/where-entity.types";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntitySelection } from "../query/entity-selection";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityCache } from "./entity-cache";
import { EntityQueryExecutionContext } from "./entity-query-execution-context";
import { EntityServiceContainer } from "./entity-service-container";
import { EntityStream } from "./entity-stream";
import { IEntityStreamInterceptor } from "./entity-stream-interceptor.interface";
import { EntityStreamPacket } from "./entity-stream-packet";
import { EntityRelationHydrator } from "./interceptors/entity-relation-hydrator";
import { LogPacketsInterceptor } from "./interceptors/log-packets.interceptor";
import { MergePacketsTakeLastInterceptor } from "./interceptors/merge-packets-take-last.interceptor";
import { WriteToStreamCacheInterceptor } from "./interceptors/write-to-stream-cache.interceptor";
import { runInterceptors } from "./run-interceptors.fn";

export interface EntityCacheInvalidationOptions {
    blueprints: Class[];
}

interface CacheOptions {
    key?: unknown;
    refresh?: boolean;
    invalidate?: Class[];
}

interface QueryArguments<T> {
    select?: PackedEntitySelection<T>;
    where?: WhereEntitySingle<T>;
    parameters?: Entity;
    cacheKey?: unknown;
    /** @deprecated use "cache.invalidate" instead */
    invalidateCache?: EntityCacheInvalidationOptions;
    cache?: boolean | CacheOptions;
}

export class EntityQueryExecutor<T extends Entity = Entity> implements IEntityStreamInterceptor {
    constructor(private readonly schema: IEntitySchema<T>, private readonly services: EntityServiceContainer) {}

    private readonly criteriaTools = this.services.getToolbag().getCriteriaTools();
    private readonly shapeTools = this.services.getToolbag().getCriteriaShapeTools();
    private readonly whereEntityTools = new WhereEntityTools(this.shapeTools, this.criteriaTools);
    private readonly queryTools = this.services.getToolbag().getQueryTools();
    private readonly selectionTools = this.services.getToolbag().getSelectionTools();
    private logPackets = false;

    enablePacketLogging(flag = true): this {
        this.logPackets = flag;
        return this;
    }

    getName(): string {
        return EntityQueryExecutor.name;
    }

    findAll$(args?: Omit<QueryArguments<T>, "where">): Observable<T[]> {
        return this.issueQuery$(args);
    }

    findMany$(args?: QueryArguments<T>): Observable<T[]> {
        return this.issueQuery$(args);
    }

    findOne$(args?: QueryArguments<T>): Observable<T | undefined> {
        return this.issueQuery$(args).pipe(map(entities => entities[0]));
    }

    async findOne(args?: QueryArguments<T>): Promise<T | undefined> {
        const entity = await lastValueFrom(this.findOne$(args));

        return entity;
    }

    findMany(args?: QueryArguments<T>): Promise<T[]> {
        return lastValueFrom(this.findMany$(args));
    }

    findAll(args?: Omit<QueryArguments<T>, "where">): Promise<T[]> {
        return lastValueFrom(this.findAll$(args));
    }

    private issueQuery$<T extends Entity>(args?: QueryArguments<T>): Observable<T[]> {
        const criteria =
            args?.where === undefined
                ? this.criteriaTools.all()
                : this.whereEntityTools.toCriterionFromWhereEntitySingle(this.schema, args.where).simplify();

        const selection = EntitySelection.unpack(this.schema, args?.select ?? {});
        const query = this.queryTools.createQuery({
            entitySchema: this.schema,
            criteria,
            selection,
            parameters: args?.parameters,
        });

        const cacheOptions = this.toCacheOptions(args?.cache);
        const cacheBucket =
            cacheOptions === false
                ? new EntityCache(this.services.getToolbag())
                : this.services.getOrCreateCache(cacheOptions.key);
        const streams: EntityStream<T>[] = [];

        if (cacheOptions !== false) {
            if (cacheOptions.refresh) {
                const resultsCache = new EntityCache(this.services.getToolbag());
                const context = new EntityQueryExecutionContext(resultsCache, cacheBucket);
                context.fromCacheOnly = true;
                const fromCacheStream = this.queryAsPacket$<T>(query, context).pipe(
                    tap(() => {
                        const relatedSchemas = this.selectionTools.getRelatedSchemas(query.getSelection());
                        // [todo] very aggressive cache clearing. good enough for now, but want to eventually use invalidateQuery() instead.
                        cacheBucket.clearBySchema(this.schema, ...relatedSchemas);
                    })
                );
                streams.push(fromCacheStream);
            }

            if (cacheOptions.invalidate) {
                const schemas = cacheOptions.invalidate.map(blueprint => this.services.getCatalog().resolve(blueprint));
                cacheBucket.clearBySchema(...schemas);
            }
        }

        const streamCache = new EntityCache(this.services.getToolbag());
        const context = new EntityQueryExecutionContext(streamCache, cacheBucket);
        this.services.getTracing().querySpawned(query);
        streams.push(this.queryAsPacket$<T>(query, context));

        return concat(...streams).pipe(
            map(packet => packet.getEntitiesFlat()),
            tap(entities => {
                this.services
                    .getTracing()
                    .queryResolved(query, `${entities.length}x entit${entities.length === 1 ? "y" : "ies"}`);
            })
        );
    }

    private toCacheOptions(options?: QueryArguments<any>["cache"]): false | CacheOptions {
        if (options === true) {
            return {};
        } else if (options === false || options === undefined) {
            return false;
        } else {
            return options;
        }
    }

    // [todo] still needed for TestContentFacade
    queryAsPacket$<T extends Entity = Entity>(
        query: IEntityQuery,
        context: EntityQueryExecutionContext
    ): Observable<EntityStreamPacket<T>> {
        const writeToCacheInterceptor = new WriteToStreamCacheInterceptor();
        const logEachPacketInterceptor = new LogPacketsInterceptor({ logEach: this.logPackets });

        const sources = [
            ...this.services.getSourcesFor(query.getEntitySchema()),
            writeToCacheInterceptor,
            logEachPacketInterceptor,
            ...this.services.getHydratorsFor(query.getEntitySchema()),
            writeToCacheInterceptor,
            logEachPacketInterceptor,
            new EntityRelationHydrator(this.services, [this]),
            writeToCacheInterceptor,
            logEachPacketInterceptor,
            new MergePacketsTakeLastInterceptor(this.services.getToolbag()), // [todo] still needed for TestContentFacade
            new LogPacketsInterceptor(this.logPackets),
        ];

        return runInterceptors<T>(sources, query, this.services.getTracing(), context).pipe(
            takeLast(1),
            tap(packet => {
                if (packet.getErrors().length) {
                    throw new Error(
                        packet
                            .getErrors()
                            .map(error => error.getErrorMessage())
                            .join(", ")
                    );
                }
            })
        );
    }

    intercept(stream: EntityStream, context: EntityQueryExecutionContext): EntityStream {
        return merge(
            stream.pipe(map(EntityStreamPacket.withoutRejected), filter(EntityStreamPacket.isNotEmpty)),
            stream.pipe(
                map(EntityStreamPacket.withOnlyRejected),
                filter(EntityStreamPacket.isNotEmpty),
                map(packet => merge(...packet.getRejectedQueries().map(query => this.queryAsPacket$(query, context)))),
                mergeAll()
            )
        );
    }
}
