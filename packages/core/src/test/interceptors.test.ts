import { lastValueFrom } from "rxjs";
import { Entity } from "../lib/common/entity.type";
import { EntityCriteriaTools } from "../lib/criteria/entity-criteria-tools";
import { EntitySet } from "../lib/entity/data-structures/entity-set";
import { EntityQueryTracing } from "../lib/execution/entity-query-tracing";
import { EntityStreamPacket } from "../lib/execution/entity-stream-packet";
import { IEntityStreamInterceptor } from "../lib/execution/interceptors/entity-stream-interceptor.interface";
import { LogPacketsInterceptor } from "../lib/execution/interceptors/log-packets.interceptor";
import { MergePacketsTakeLastInterceptor } from "../lib/execution/interceptors/merge-packets-take-last.interceptor";
import { SchemaRelationBasedHydrator } from "../lib/execution/interceptors/schema-relation-based-hydrator";
import { runInterceptors } from "../lib/execution/run-interceptors.fn";
import { IEntityQuery } from "../lib/query/entity-query.interface";
import {
    TestContentData,
    TestContentDatabase,
    TestContentEntityApi,
    TestContentFacade,
    UserBlueprint,
} from "./content";
import { TestContentCatalog } from "./content/test-content-catalog";
import { createQuery } from "./tools/create-query.fn";
import { expectPacketEqual } from "./tools/expect-packet-equal.fn";

const LOG_PACKETS = false;
const LOG_TRACING = false;

describe("interceptors", () => {
    const criteriaTools = new EntityCriteriaTools();

    function createFacade({
        logPackets,
        logTracing,
    }: {
        logPackets?: boolean;
        logTracing?: boolean;
    } = {}): TestContentFacade {
        return new TestContentFacade()
            .enablePacketLogging(logPackets ?? LOG_PACKETS)
            .enableTracing(logTracing ?? LOG_TRACING);
    }

    function createExpectedPacket(query: IEntityQuery, entities: Entity[]): EntityStreamPacket {
        return new EntityStreamPacket({
            accepted: [query],
            payload: [new EntitySet({ query, entities })],
        });
    }

    it("should load all users", async () => {
        // arrange
        const facade = createFacade()
            .setData("users", [{ id: 2 }, { id: 3 }])
            .configureApi(api => api.withGetAllUsers());

        const query = facade.createQuery(UserBlueprint);
        const expected = createExpectedPacket(query, [{ id: 2 }, { id: 3 }]);

        // act
        const actual = await facade.query(query);

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should load one user by id", async () => {
        // arrange
        const facade = createFacade()
            .setData("users", [{ id: 2 }, { id: 7 }])
            .configureApi(api => api.withGetUserById());

        const query = facade.createQuery(UserBlueprint, { id: 2 }, { id: true });
        const expected = createExpectedPacket(query, [{ id: 2 }]);

        // act
        const actual = await facade.query(query);

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should load one user by id & hydrate one relation", async () => {
        // arrange
        const facade = createFacade()
            .setData("users", [{ id: 2, parentId: 7 }, { id: 7 }])
            .configureApi(api => api.withGetUserById());

        const query = facade.createQuery(UserBlueprint, { id: 2 }, { id: true, parentId: true, parent: { id: true } });
        const expected = createExpectedPacket(query, [{ id: 2, parentId: 7, parent: { id: 7 } }]);

        // act
        const actual = await facade.query(query);

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should load two users by id with a hydrated relation that is also filtered by id", async () => {
        // arrange
        const facade = createFacade()
            .setData("users", [{ id: 2, parentId: 7 }, { id: 7 }, { id: 3, parentId: 8 }, { id: 8 }])
            .configureApi(api => api.withGetUserById());

        const query = facade.createQuery(
            UserBlueprint,
            { id: [2, 3], parent: { id: 7 } },
            { id: true, parentId: true, parent: { id: true } }
        );

        const expected = createExpectedPacket(query, [{ id: 2, parentId: 7, parent: { id: 7 } }]);

        // act
        const actual = await facade.query(query);

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should load users with crriteria on relation only)", async () => {
        // arrange
        const facade = createFacade()
            .setData("users", [{ id: 2, parentId: 7 }, { id: 7 }, { id: 3, parentId: 8 }, { id: 8 }])
            .configureApi(api => api.withGetUserById().withGetAllUsers());

        const query = facade.createQuery(
            UserBlueprint,
            { parent: { id: 7 } },
            { id: true, parentId: true, parent: { id: true } }
        );

        const expected = createExpectedPacket(query, [{ id: 2, parentId: 7, parent: { id: 7 } }]);

        // act
        const actual = await facade.query(query);

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should load one user with nested hydrated relations", async () => {
        // arrange
        const facade = createFacade()
            .setData("users", [{ id: 2, parentId: 7 }, { id: 7, parentId: 13 }, { id: 13, parentId: 64 }, { id: 64 }])
            .configureApi(api => api.withGetUserById());

        const query = facade.createQuery(
            UserBlueprint,
            { id: 2 },
            {
                id: true,
                parentId: true,
                parent: { id: true, parentId: true, parent: { id: true, parentId: true, parent: { id: true } } },
            }
        );

        const expected = createExpectedPacket(query, [
            {
                id: 2,
                parentId: 7,
                parent: { id: 7, parentId: 13, parent: { id: 13, parentId: 64, parent: { id: 64 } } },
            },
        ]);

        // act
        const actual = await facade.query(query);

        // assert
        expectPacketEqual(actual, expected);
    });
});
