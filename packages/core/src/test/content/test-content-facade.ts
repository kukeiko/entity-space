import { Class } from "@entity-space/utils";
import { filter, from, lastValueFrom, map, merge, switchMap } from "rxjs";
import { Entity } from "../../lib/common/entity.type";
import { UnpackedEntitySelection } from "../../lib/common/unpacked-entity-selection.type";
import { EntityCriteriaTools } from "../../lib/criteria/entity-criteria-tools";
import { EntityWhere } from "../../lib/criteria/entity-criteria-tools.interface";
import { EntityServiceContainer } from "../../lib/execution/entity-service-container";
import { EntityStream } from "../../lib/execution/entity-stream";
import { EntityStreamPacket } from "../../lib/execution/entity-stream-packet";
import { EntityRelationHydrator } from "../../lib/execution/interceptors/entity-relation-hydrator";
import { IEntityStreamInterceptor } from "../../lib/execution/interceptors/entity-stream-interceptor.interface";
import { LogPacketsInterceptor } from "../../lib/execution/interceptors/log-packets.interceptor";
import { MergePacketsTakeLastInterceptor } from "../../lib/execution/interceptors/merge-packets-take-last.interceptor";
import { runInterceptors } from "../../lib/execution/run-interceptors.fn";
import { EntityQueryTools } from "../../lib/query/entity-query-tools";
import { IEntityQuery } from "../../lib/query/entity-query.interface";
import { EntityBlueprintInstance } from "../../lib/schema/entity-blueprint-instance.type";
import { TestContentData, TestContentDatabase } from "./test-content-database";
import { TestContentEndpoints } from "./test-content-endpoints";

export class TestContentFacade implements IEntityStreamInterceptor {
    private readonly services = new EntityServiceContainer();
    private readonly database = new TestContentDatabase();
    private readonly endpoints = new TestContentEndpoints(this.database, this.services);
    private packetLogging = false;

    getName(): string {
        return TestContentFacade.name;
    }

    setData<K extends keyof TestContentData>(key: K, entities: TestContentData[K]): this {
        this.database.set(key, entities);
        return this;
    }

    enableTracing(flag = false): this {
        this.services.getTracing().enableConsole(flag);
        return this;
    }

    enablePacketLogging(flag = false): this {
        this.packetLogging = flag;
        return this;
    }

    configureEndpoints(configure: (endpoints: TestContentEndpoints) => unknown): this {
        configure(this.endpoints);
        return this;
    }

    createQuery<T>(
        blueprint: Class<T>,
        criteria?: EntityWhere<EntityBlueprintInstance<T>>,
        selection?: UnpackedEntitySelection<EntityBlueprintInstance<T>>
    ): IEntityQuery {
        const criteriaTools = new EntityCriteriaTools();

        return new EntityQueryTools({ criteriaTools: criteriaTools }).createQuery({
            entitySchema: this.services.getCatalog().resolve(blueprint),
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
        const hydrator = new EntityRelationHydrator(this.services, [this]);

        let interceptors: IEntityStreamInterceptor[] = [
            ...this.services.getSourcesFor(query.getEntitySchema()),
            new LogPacketsInterceptor({ logEach: this.packetLogging }),
            hydrator,
            new LogPacketsInterceptor({ logEach: this.packetLogging }),
            new MergePacketsTakeLastInterceptor(this.services.getToolbag()),
            new LogPacketsInterceptor(this.packetLogging),
        ];

        const packet = await lastValueFrom(runInterceptors(interceptors, query, this.services.getTracing()));

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
