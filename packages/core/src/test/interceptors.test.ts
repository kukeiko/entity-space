import { matches } from "@entity-space/criteria";
import { lastValueFrom } from "rxjs";
import { EntitySet } from "../lib/entity/data-structures/entity-set";
import { IEntityStreamInterceptor } from "../lib/execution/i-entity-stream-interceptor";
import { LogPacketsInterceptor } from "../lib/execution/interceptors/log-packets.interceptor";
import { MergePacketsTakeLastInterceptor } from "../lib/execution/interceptors/merge-packets-take-last.interceptor";
import { SchemaRelationBasedHydrator } from "../lib/execution/interceptors/schema-relation-based-hydrator";
import { EntityStreamPacket } from "../lib/execution/entity-stream-packet";
import { runInterceptors } from "../lib/execution/run-interceptors.fn";
import { EntityQuery } from "../lib/query/entity-query";
import { EntityQueryTracing } from "../lib/execution/entity-query-tracing";
import { TestContentData, TestContentDatabase, TestContentEntityApi, User, UserBlueprint } from "./content";
import { TestContentCatalog } from "./content/test-content-catalog";
import { createQuery } from "./tools/create-query.fn";

const LOG_PACKETS = false;
const LOG_TRACING = false;

function expectPacketEqual(actual: EntityStreamPacket, expected: EntityStreamPacket): void {
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
        tracing.enableConsole(LOG_TRACING);

        const interceptors: IEntityStreamInterceptor[] = [
            new TestContentEntityApi(database, catalog, tracing).withGetAllUsers(),
            new LogPacketsInterceptor(LOG_PACKETS),
            new MergePacketsTakeLastInterceptor(),
        ];

        const queries: EntityQuery[] = [createQuery(catalog, UserBlueprint, void 0, { id: true })];

        const expected = new EntityStreamPacket({
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
        tracing.enableConsole(LOG_TRACING);

        const interceptors: IEntityStreamInterceptor[] = [
            new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
            new LogPacketsInterceptor(LOG_PACKETS),
            new MergePacketsTakeLastInterceptor(),
        ];

        const query: EntityQuery = createQuery(catalog, UserBlueprint, { id: 2 }, { id: true });

        const expected = new EntityStreamPacket({
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
        tracing.enableConsole(LOG_TRACING);

        const interceptors: IEntityStreamInterceptor[] = [
            new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
            new SchemaRelationBasedHydrator(tracing, [
                new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
            ]),
            new LogPacketsInterceptor(LOG_PACKETS),
            new MergePacketsTakeLastInterceptor(),
        ];

        const query: EntityQuery = createQuery(
            catalog,
            UserBlueprint,
            { id: 2 },
            { id: true, parentId: true, parent: { id: true } }
        );

        const expected = new EntityStreamPacket({
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
        tracing.enableConsole(LOG_TRACING);

        const interceptors: IEntityStreamInterceptor[] = [
            new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
            new SchemaRelationBasedHydrator(tracing, [
                new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
            ]),
            new LogPacketsInterceptor(LOG_PACKETS),
            new MergePacketsTakeLastInterceptor(),
        ];

        const query: EntityQuery = createQuery(
            catalog,
            UserBlueprint,
            { id: [2, 3], parent: matches<User>({ id: 7 }) },
            { id: true, parentId: true, parent: { id: true } }
        );

        const expected = new EntityStreamPacket({
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
        tracing.enableConsole(LOG_TRACING);

        const interceptors: IEntityStreamInterceptor[] = [
            new TestContentEntityApi(database, catalog, tracing).withGetAllUsers(),
            new SchemaRelationBasedHydrator(tracing, [
                new TestContentEntityApi(database, catalog, tracing).withGetUserById(),
            ]),
            new LogPacketsInterceptor(LOG_PACKETS),
            new MergePacketsTakeLastInterceptor(),
        ];

        const query: EntityQuery = createQuery(
            catalog,
            UserBlueprint,
            { parent: matches<User>({ id: 7 }) },
            { id: true, parentId: true, parent: { id: true } }
        );

        const expected = new EntityStreamPacket({
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

    it("should load data #5.A (deep selection on parent)", async () => {
        // arrange
        const data: TestContentData = {
            users: [{ id: 2, parentId: 7 }, { id: 7, parentId: 13 }, { id: 13, parentId: 64 }, { id: 64 }],
        };
        const database = new TestContentDatabase(data);
        const tracing = new EntityQueryTracing();
        const catalog = new TestContentCatalog();
        tracing.enableConsole(LOG_TRACING);

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
            new LogPacketsInterceptor(LOG_PACKETS),
            new MergePacketsTakeLastInterceptor(),
        ];

        const query: EntityQuery = createQuery(
            catalog,
            UserBlueprint,
            { id: 2 },
            {
                id: true,
                parentId: true,
                parent: { id: true, parentId: true, parent: { id: true, parentId: true, parent: { id: true } } },
            }
        );

        const expected = new EntityStreamPacket({
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

    it("should load data #5.B (deep selection on parent, using getAll() on root)", async () => {
        // arrange
        const data: TestContentData = {
            users: [{ id: 2, parentId: 7 }, { id: 7, parentId: 13 }, { id: 13, parentId: 64 }, { id: 64 }],
        };
        const database = new TestContentDatabase(data);
        const tracing = new EntityQueryTracing();
        const catalog = new TestContentCatalog();
        tracing.enableConsole(LOG_TRACING);

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
            new LogPacketsInterceptor(LOG_PACKETS),
        ];

        const query: EntityQuery = createQuery(
            catalog,
            UserBlueprint,
            { id: 2 },
            {
                id: true,
                parentId: true,
                parent: { id: true, parentId: true, parent: { id: true, parentId: true, parent: { id: true } } },
            }
        );

        const expected = new EntityStreamPacket({
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
