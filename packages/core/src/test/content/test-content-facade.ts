import { Class } from "@entity-space/utils";
import { UnpackedEntitySelection } from "../../lib/common/unpacked-entity-selection.type";
import { EntityCriteriaTools } from "../../lib/criteria/entity-criteria-tools";
import { EntityWhere } from "../../lib/criteria/entity-criteria-tools.interface";
import { EntityQueryExecutor } from "../../lib/execution/entity-query-executor";
import { EntityServiceContainer } from "../../lib/execution/entity-service-container";
import { EntityStreamPacket } from "../../lib/execution/entity-stream-packet";
import { EntityQueryTools } from "../../lib/query/entity-query-tools";
import { IEntityQuery } from "../../lib/query/entity-query.interface";
import { EntityBlueprintInstance } from "../../lib/schema/entity-blueprint-instance.type";
import { TestContentData, TestContentDatabase } from "./test-content-database";
import { TestContentEndpoints } from "./test-content-endpoints";

export class TestContentFacade {
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

    query(query: IEntityQuery): Promise<EntityStreamPacket> {
        return new EntityQueryExecutor(query.getEntitySchema(), this.services)
            .enablePacketLogging(this.packetLogging)
            .queryAsPacket(query);
    }
}
