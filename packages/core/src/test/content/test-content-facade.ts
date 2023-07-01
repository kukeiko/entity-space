import { Class } from "@entity-space/utils";
import { filter, from, lastValueFrom, map, merge, switchMap } from "rxjs";
import { Entity } from "../../lib/common/entity.type";
import { UnpackedEntitySelection } from "../../lib/common/unpacked-entity-selection.type";
import { EntityCriteriaTools } from "../../lib/criteria/entity-criteria-tools";
import { EntityWhere } from "../../lib/criteria/entity-criteria-tools.interface";
import { EntityQueryTracing } from "../../lib/execution/entity-query-tracing";
import { EntityStream } from "../../lib/execution/entity-stream";
import { EntityStreamPacket } from "../../lib/execution/entity-stream-packet";
import { IEntityStreamInterceptor } from "../../lib/execution/interceptors/entity-stream-interceptor.interface";
import { LogPacketsInterceptor } from "../../lib/execution/interceptors/log-packets.interceptor";
import { MergePacketsTakeLastInterceptor } from "../../lib/execution/interceptors/merge-packets-take-last.interceptor";
import { SchemaRelationBasedHydrator } from "../../lib/execution/interceptors/schema-relation-based-hydrator";
import { runInterceptors } from "../../lib/execution/run-interceptors.fn";
import { EntityQueryTools } from "../../lib/query/entity-query-tools";
import { IEntityQuery } from "../../lib/query/entity-query.interface";
import { EntityBlueprintInstance } from "../../lib/schema/entity-blueprint-instance.type";
import { TestContentCatalog } from "./test-content-catalog";
import { TestContentData, TestContentDatabase } from "./test-content-database";
import { TestContentEntityApi } from "./test-content.entity-api";

export class TestContentFacade implements IEntityStreamInterceptor {
    private readonly tracing = new EntityQueryTracing();
    private readonly catalog = new TestContentCatalog();
    private readonly repository = new TestContentDatabase();
    private readonly api = new TestContentEntityApi(this.repository, this.catalog, this.tracing);
    private packetLogging = false;

    setData<K extends keyof TestContentData>(key: K, entities: TestContentData[K]): this {
        this.repository.set(key, entities);
        return this;
    }

    enableTracing(flag = false): this {
        this.tracing.enableConsole(flag);
        return this;
    }

    enablePacketLogging(flag = false): this {
        this.packetLogging = flag;
        return this;
    }

    configureApi(configure: (api: TestContentEntityApi) => unknown): this {
        configure(this.api);
        return this;
    }

    createQuery<T>(
        blueprint: Class<T>,
        criteria?: EntityWhere<EntityBlueprintInstance<T>>,
        selection?: UnpackedEntitySelection<EntityBlueprintInstance<T>>
    ): IEntityQuery {
        const criteriaTools = new EntityCriteriaTools();

        return new EntityQueryTools({ criteriaTools: criteriaTools }).createQuery({
            entitySchema: this.catalog.resolve(blueprint),
            criteria: criteria ? criteriaTools.where(criteria) : criteriaTools.all(),
            selection,
        });
    }

    intercept(stream: EntityStream<Entity>): EntityStream<Entity> {
        return merge(
            stream.pipe(map(EntityStreamPacket.withoutRejected), filter(EntityStreamPacket.isNotEmpty)),
            stream.pipe(
                map(EntityStreamPacket.withOnlyRejected),
                filter(EntityStreamPacket.isNotEmpty),
                switchMap(packet => merge(...packet.getRejectedQueries().map(query => from(this.query(query)))))
            )
        );
    }

    async query(query: IEntityQuery): Promise<EntityStreamPacket> {
        const hydrator = new SchemaRelationBasedHydrator(this.tracing, [this]);

        let interceptors: IEntityStreamInterceptor[] = [
            this.api,
            new LogPacketsInterceptor({ logEach: this.packetLogging }),
            hydrator,
            new LogPacketsInterceptor({ logEach: this.packetLogging }),
            new MergePacketsTakeLastInterceptor(),
            new LogPacketsInterceptor(this.packetLogging),
        ];

        const packet = await lastValueFrom(runInterceptors(interceptors, [query]));

        if (packet.getErrors().length) {
            throw new Error(
                packet
                    .getErrors()
                    .map(error => error.getErrorMessage())
                    .join(", ")
            );
        }

        return packet;
    }
}
