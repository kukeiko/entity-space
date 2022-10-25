import { Entity } from "@entity-space/common";
import { matches } from "@entity-space/criteria";
import { EntitySourceGateway } from "../lib/execution/entity-source-gateway";
import { Query } from "../lib/query/query";
import { reduceQueries } from "../lib/query/reduce-queries.fn";
import { EntityQueryTracing } from "../lib/tracing/entity-query-tracing";
import { TestContentData, TestContentDatabase, TestContentEntityApi, User, UserBlueprint } from "./content";
import { TestContentCatalog } from "./content/test-content-catalog";
import { createQuery } from "./tools/create-query.fn";
import { queryTestHelper, QueryTestHelperOptions } from "./tools/query-test-helper.fn";

describe("entity-source-gateway", () => {
    let catalog = new TestContentCatalog();

    function wrappedQueryTestHelper({
        title,
        data,
        buildApi,
        query,
        expected,
        options,
    }: {
        title: string;
        data: TestContentData;
        buildApi: (api: TestContentEntityApi) => TestContentEntityApi;
        query: Query;
        expected: { entities?: Entity[]; rejected?: Query[] | "all"; accepted?: Query[] | "all" };
        options?: QueryTestHelperOptions;
    }): void {
        it(title, async () => {
            // arrange
            const catalog = new TestContentCatalog();
            const database = new TestContentDatabase(data);
            const tracing = new EntityQueryTracing();

            if (options === true || options?.logTracing) {
                tracing.enableConsole();
            }

            const api = buildApi(new TestContentEntityApi(database, catalog, tracing));
            const gateway = new EntitySourceGateway([api], tracing);

            // act
            const [entities, packet] = await queryTestHelper<User>(query, gateway, options);

            // assert
            if (expected.entities) {
                expect(entities).toEqual(expected.entities);
            }

            if (expected.accepted) {
                const accepted = expected.accepted === "all" ? [query] : expected.accepted;

                expect(reduceQueries(accepted, packet.getAcceptedQueries())).toEqual([]);
            }

            if (expected.rejected) {
                const rejected = expected.rejected === "all" ? [query] : expected.rejected;
                expect(reduceQueries(rejected, packet.getRejectedQueries())).toEqual([]);
            }
        });
    }

    wrappedQueryTestHelper({
        title: "should work #1 (get all)",
        buildApi: api => api.withGetAllUsers(),
        data: { users: [{ id: 2 }, { id: 3 }] },
        query: createQuery(catalog, UserBlueprint, void 0, { id: true }),
        expected: { entities: [{ id: 2 }, { id: 3 }], accepted: "all", rejected: [] },
    });

    wrappedQueryTestHelper({
        title: "should work #2 (criteria on root)",
        // buildApi: api => api.withGetAllUsers(),
        buildApi: api => api.withGetUserById(),
        data: { users: [{ id: 2, parentId: 7 }, { id: 7 }] },
        query: createQuery(catalog, UserBlueprint, { id: 2 }, { id: true, parentId: true, parent: { id: true } }),
        expected: { entities: [{ id: 2, parentId: 7, parent: { id: 7 } }], accepted: "all", rejected: [] },
    });

    wrappedQueryTestHelper({
        title: "should work #3 (criteria on both root and parent)",
        // buildApi: api => api.withGetAllUsers(),
        buildApi: api => api.withGetUserById(),
        data: { users: [{ id: 2, parentId: 7 }, { id: 7 }] },
        query: createQuery(
            catalog,
            UserBlueprint,
            { id: 2, parent: matches<User>({ id: 7 }) },
            { id: true, parentId: true, parent: { id: true } }
        ),
        expected: { entities: [{ id: 2, parentId: 7, parent: { id: 7 } }], accepted: "all", rejected: [] },
    });

    wrappedQueryTestHelper({
        title: "should work #4 (criteria on parent only)",
        buildApi: api => api.withGetAllUsers(),
        data: { users: [{ id: 2, parentId: 7 }, { id: 7 }] },
        query: createQuery(
            catalog,
            UserBlueprint,
            { parent: matches<User>({ id: 7 }) },
            { id: true, parentId: true, parent: { id: true } }
        ),
        expected: { entities: [{ id: 2, parentId: 7, parent: { id: 7 } }], accepted: "all", rejected: [] },
    });

    wrappedQueryTestHelper({
        title: "should work #5 (deep expansion on parent)",
        buildApi: api => api.withGetUserById(),
        data: { users: [{ id: 2, parentId: 7 }, { id: 7, parentId: 13 }, { id: 13, parentId: 64 }, { id: 64 }] },
        query: createQuery(
            catalog,
            UserBlueprint,
            { id: 2 },
            {
                id: true,
                parentId: true,
                parent: { id: true, parentId: true, parent: { id: true, parentId: true, parent: { id: true } } },
            }
        ),
        expected: {
            entities: [
                {
                    id: 2,
                    parentId: 7,
                    parent: { id: 7, parentId: 13, parent: { id: 13, parentId: 64, parent: { id: 64 } } },
                },
            ],
            accepted: "all",
            rejected: [],
        },
    });
});
