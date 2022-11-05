import { matches } from "@entity-space/criteria";
import { lastValueFrom } from "rxjs";
import { EntitySet } from "../lib/entity/data-structures/entity-set";
import { IEntityStreamInterceptor } from "../lib/execution/i-entity-stream-interceptor";
import { LogPacketsInterceptor } from "../lib/execution/interceptors/log-packets.interceptor";
import { MergePacketsTakeLastInterceptor } from "../lib/execution/interceptors/merge-packets-take-last.interceptor";
import { SchemaRelationBasedHydrator } from "../lib/execution/interceptors/schema-relation-based-hydrator";
import { QueryStreamPacket } from "../lib/execution/query-stream-packet";
import { runInterceptors } from "../lib/execution/run-interceptors.fn";
import { Query } from "../lib/query/query";
import { EntityQueryTracing } from "../lib/tracing/entity-query-tracing";
import { TestContentData, TestContentDatabase, TestContentEntityApi, User, UserBlueprint } from "./content";
import { TestContentCatalog } from "./content/test-content-catalog";
import { createQuery } from "./tools/create-query.fn";

function expectPacketEqual(actual: QueryStreamPacket, expected: QueryStreamPacket): void {
    expect(actual.getErrors().map(error => error.getErrorMessage())).toEqual(
        expected.getErrors().map(error => error.getErrorMessage())
    );

    expect(actual.getAcceptedQueries().map(query => query.toString())).toEqual(
        expected.getAcceptedQueries().map(query => query.toString())
    );

    expect(actual.getRejectedQueries().map(query => query.toString())).toEqual(
        expected.getRejectedQueries().map(query => query.toString())
    );

    expect(actual.getPayload().map(payload => payload.getQuery().toString())).toEqual(
        expected.getPayload().map(payload => payload.getQuery().toString())
    );

    expect(actual.getPayload().map(payload => payload.getEntities())).toEqual(
        expected.getPayload().map(payload => payload.getEntities())
    );
}

describe("interceptors", () => {
    it("should load data #1.A (get all)", async () => {
        // arrange
        const data: TestContentData = { users: [{ id: 2 }, { id: 3 }] };
        const database = new TestContentDatabase(data);
        const tracing = new EntityQueryTracing();
        const catalog = new TestContentCatalog();
        tracing.enableConsole();

        const interceptors: IEntityStreamInterceptor[] = [
            new TestContentEntityApi(database, catalog, tracing).withGetAllUsers(),
            new LogPacketsInterceptor(true),
            new MergePacketsTakeLastInterceptor(),
        ];

        const queries: Query[] = [createQuery(catalog, UserBlueprint, void 0, { id: true })];

        const expected = new QueryStreamPacket({
            accepted: queries,
            payload: [new EntitySet({ query: queries[0], entities: [{ id: 2 }, { id: 3 }] })],
        });

        // act
        const actual = await lastValueFrom(runInterceptors(interceptors, queries));

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should load data #1.B (criteria on root)", async () => {
        // arrange
        const data: TestContentData = { users: [{ id: 2 }, { id: 7 }] };
        const database = new TestContentDatabase(data);
        const tracing = new EntityQueryTracing();
        const catalog = new TestContentCatalog();
        tracing.enableConsole();

        const interceptors: IEntityStreamInterceptor[] = [
            new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
            new LogPacketsInterceptor(true),
            new MergePacketsTakeLastInterceptor(),
        ];

        const query: Query = createQuery(catalog, UserBlueprint, { id: 2 }, { id: true });

        const expected = new QueryStreamPacket({
            accepted: [query],
            payload: [new EntitySet({ query, entities: [{ id: 2 }] })],
        });

        // act
        const actual = await lastValueFrom(runInterceptors(interceptors, [query]));

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should load data #2 (criteria on root + hydrate parent)", async () => {
        // arrange
        const data: TestContentData = { users: [{ id: 2, parentId: 7 }, { id: 7 }] };
        const database = new TestContentDatabase(data);
        const tracing = new EntityQueryTracing();
        const catalog = new TestContentCatalog();
        tracing.enableConsole();

        const interceptors: IEntityStreamInterceptor[] = [
            new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
            new SchemaRelationBasedHydrator(tracing, [
                new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
            ]),
            new LogPacketsInterceptor(true),
            new MergePacketsTakeLastInterceptor(),
        ];

        const query: Query = createQuery(
            catalog,
            UserBlueprint,
            { id: 2 },
            { id: true, parentId: true, parent: { id: true } }
        );

        const expected = new QueryStreamPacket({
            accepted: [query],
            payload: [new EntitySet({ query, entities: [{ id: 2, parentId: 7, parent: { id: 7 } }] })],
        });

        // act
        const actual = await lastValueFrom(runInterceptors(interceptors, [query]));

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should load data #3 (criteria on both root and parent + hydrate parent)", async () => {
        // arrange
        const data: TestContentData = { users: [{ id: 2, parentId: 7 }, { id: 7 }, { id: 3, parentId: 7 }] };
        const database = new TestContentDatabase(data);
        const tracing = new EntityQueryTracing();
        const catalog = new TestContentCatalog();
        tracing.enableConsole();

        const interceptors: IEntityStreamInterceptor[] = [
            new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
            new SchemaRelationBasedHydrator(tracing, [
                new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
            ]),
            new LogPacketsInterceptor(true),
            new MergePacketsTakeLastInterceptor(),
        ];

        const query: Query = createQuery(
            catalog,
            UserBlueprint,
            { id: [2, 3], parent: matches<User>({ id: 7 }) },
            { id: true, parentId: true, parent: { id: true } }
        );

        const expected = new QueryStreamPacket({
            accepted: [query],
            payload: [
                new EntitySet({
                    query,
                    entities: [
                        { id: 2, parentId: 7, parent: { id: 7 } },
                        { id: 3, parentId: 7, parent: { id: 7 } },
                    ],
                }),
            ],
        });

        // act
        const actual = await lastValueFrom(runInterceptors(interceptors, [query]));

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should load data #4 (criteria on parent only + hydrate parent)", async () => {
        // arrange
        const data: TestContentData = { users: [{ id: 2, parentId: 7 }, { id: 7 }] };
        const database = new TestContentDatabase(data);
        const tracing = new EntityQueryTracing();
        const catalog = new TestContentCatalog();
        tracing.enableConsole();

        const interceptors: IEntityStreamInterceptor[] = [
            new TestContentEntityApi(database, catalog, tracing).withGetAllUsers(),
            new SchemaRelationBasedHydrator(tracing, [
                new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
            ]),
            new LogPacketsInterceptor(true),
            new MergePacketsTakeLastInterceptor(),
        ];

        const query: Query = createQuery(
            catalog,
            UserBlueprint,
            { parent: matches<User>({ id: 7 }) },
            { id: true, parentId: true, parent: { id: true } }
        );

        const expected = new QueryStreamPacket({
            accepted: [query],
            payload: [
                new EntitySet({
                    query,
                    entities: [{ id: 2, parentId: 7, parent: { id: 7 } }],
                }),
            ],
        });

        // act
        const actual = await lastValueFrom(runInterceptors(interceptors, [query]));

        // assert
        expectPacketEqual(actual, expected);
    });

    // wrappedQueryTestHelper({
    //     title: "should work #5 (deep expansion on parent)",
    //     buildApi: api => api.withGetUserById(),
    //     data: { users: [{ id: 2, parentId: 7 }, { id: 7, parentId: 13 }, { id: 13, parentId: 64 }, { id: 64 }] },
    //     query: createQuery(
    //         catalog,
    //         UserBlueprint,
    //         { id: 2 },
    //         {
    //             id: true,
    //             parentId: true,
    //             parent: { id: true, parentId: true, parent: { id: true, parentId: true, parent: { id: true } } },
    //         }
    //     ),
    //     expected: {
    //         entities: [
    //             {
    //                 id: 2,
    //                 parentId: 7,
    //                 parent: { id: 7, parentId: 13, parent: { id: 13, parentId: 64, parent: { id: 64 } } },
    //             },
    //         ],
    //         accepted: "all",
    //         rejected: [],
    //     },
    // });

    it("should load data #5.A (deep expansion on parent)", async () => {
        // arrange
        const data: TestContentData = {
            users: [{ id: 2, parentId: 7 }, { id: 7, parentId: 13 }, { id: 13, parentId: 64 }, { id: 64 }],
        };
        const database = new TestContentDatabase(data);
        const tracing = new EntityQueryTracing();
        const catalog = new TestContentCatalog();
        tracing.enableConsole();

        const interceptors: IEntityStreamInterceptor[] = [
            new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
            new SchemaRelationBasedHydrator(tracing, [
                new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
                new SchemaRelationBasedHydrator(tracing, [
                    new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
                    new SchemaRelationBasedHydrator(tracing, [
                        new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
                    ]),
                ]),
            ]),
            new LogPacketsInterceptor(true),
            new MergePacketsTakeLastInterceptor(),
        ];

        const query: Query = createQuery(
            catalog,
            UserBlueprint,
            { id: 2 },
            {
                id: true,
                parentId: true,
                parent: { id: true, parentId: true, parent: { id: true, parentId: true, parent: { id: true } } },
            }
        );

        const expected = new QueryStreamPacket({
            accepted: [query],
            payload: [
                new EntitySet({
                    query,
                    entities: [
                        {
                            id: 2,
                            parentId: 7,
                            parent: { id: 7, parentId: 13, parent: { id: 13, parentId: 64, parent: { id: 64 } } },
                        },
                    ],
                }),
            ],
        });

        // act
        const actual = await lastValueFrom(runInterceptors(interceptors, [query]));

        // assert
        expectPacketEqual(actual, expected);
    });

    it("should load data #5.B (deep expansion on parent, using getAll() on root)", async () => {
        // arrange
        const data: TestContentData = {
            users: [{ id: 2, parentId: 7 }, { id: 7, parentId: 13 }, { id: 13, parentId: 64 }, { id: 64 }],
        };
        const database = new TestContentDatabase(data);
        const tracing = new EntityQueryTracing();
        const catalog = new TestContentCatalog();
        tracing.enableConsole();

        const interceptors: IEntityStreamInterceptor[] = [
            new TestContentEntityApi(database, catalog, tracing).withGetAllUsers(),
            new SchemaRelationBasedHydrator(tracing, [
                new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
                new SchemaRelationBasedHydrator(tracing, [
                    new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
                    new SchemaRelationBasedHydrator(tracing, [
                        new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
                    ]),
                ]),
            ]),
            new MergePacketsTakeLastInterceptor(),
            new LogPacketsInterceptor(true),
        ];

        const query: Query = createQuery(
            catalog,
            UserBlueprint,
            { id: 2 },
            {
                id: true,
                parentId: true,
                parent: { id: true, parentId: true, parent: { id: true, parentId: true, parent: { id: true } } },
            }
        );

        const expected = new QueryStreamPacket({
            accepted: [query],
            payload: [
                new EntitySet({
                    query,
                    entities: [
                        {
                            id: 2,
                            parentId: 7,
                            parent: { id: 7, parentId: 13, parent: { id: 13, parentId: 64, parent: { id: 64 } } },
                        },
                    ],
                }),
            ],
        });

        // act
        const actual = await lastValueFrom(runInterceptors(interceptors, [query]));

        // assert
        expectPacketEqual(actual, expected);
    });
});
