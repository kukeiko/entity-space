import { defaultIfEmpty, lastValueFrom, of, ReplaySubject, shareReplay, switchMap, tap } from "rxjs";
import { EntityCriteriaTools } from "../lib/criteria/entity-criteria-tools";
import { EntitySet } from "../lib/entity/data-structures/entity-set";
import { EntityQueryTracing } from "../lib/execution/entity-query-tracing";
import { EntityStream } from "../lib/execution/entity-stream";
import { IEntityStreamInterceptor } from "../lib/execution/entity-stream-interceptor.interface";
import { EntityStreamPacket } from "../lib/execution/entity-stream-packet";
import { LogPacketsInterceptor } from "../lib/execution/interceptors/log-packets.interceptor";
import { SchemaRelationBasedHydrator } from "../lib/execution/interceptors/schema-relation-based-hydrator";
import { EntityQueryTools } from "../lib/query/entity-query-tools";
import { parseQuery } from "../lib/query/parse-query.fn";
import { EntityBlueprint } from "../lib/schema/entity-blueprint";
import { EntityBlueprintInstance } from "../lib/schema/entity-blueprint-instance.type";
import { define } from "../lib/schema/entity-blueprint-property";
import { EntitySchemaCatalog } from "../lib/schema/entity-schema-catalog";
import { createQuery } from "./tools/create-query.fn";
import { expectPacketEqual } from "./tools/expect-packet-equal.fn";

function createTestHydrationInterceptor(
    emittedPacket: EntityStreamPacket,
    pushInterceptedInto: EntityStreamPacket[]
): IEntityStreamInterceptor {
    return {
        intercept(stream: EntityStream): EntityStream {
            return stream.pipe(
                switchMap(packet => {
                    pushInterceptedInto.push(packet);
                    return of(emittedPacket);
                })
            );
        },
    };
}

describe(SchemaRelationBasedHydrator.name, () => {
    const LOG_PACKETS = false;
    const LOG_TRACING = false;

    const criteriaTools = new EntityCriteriaTools();
    const queryTools = new EntityQueryTools({ criteriaTools });
    const tracing = new EntityQueryTracing();
    tracing.enableConsole(LOG_TRACING);
    const packetLogger = new LogPacketsInterceptor(LOG_PACKETS);

    @EntityBlueprint({ id: "user" })
    class UserBlueprint {
        id = define(Number, { id: true, required: true });
        name = define(String, { required: true });
    }

    type User = EntityBlueprintInstance<UserBlueprint>;

    @EntityBlueprint({ id: "metadata" })
    class MetadataBlueprint {
        createdById = define(Number, { required: true, index: true });
        createdBy = define(UserBlueprint, { relation: true, from: "createdById", to: "id" });
        updatedById = define(Number, { required: true, index: true });
        updatedBy = define(UserBlueprint, { relation: true, from: "updatedById", to: "id" });
    }

    type Metadata = EntityBlueprintInstance<MetadataBlueprint>;

    @EntityBlueprint({ id: "album" })
    class AlbumBlueprint {
        id = define(Number, { id: true, required: true });
        songs = define(SongBlueprint, { array: true, relation: true, from: "id", to: "albumId" });
        metadata = define(MetadataBlueprint);
    }

    type Album = EntityBlueprintInstance<AlbumBlueprint>;

    @EntityBlueprint({ id: "song" })
    class SongBlueprint {
        id = define(Number, { id: true, required: true });
        albumId = define(Number, { required: true, index: true });
    }

    type Song = EntityBlueprintInstance<SongBlueprint>;

    const catalog = new EntitySchemaCatalog();
    const albumSchema = catalog.resolve(AlbumBlueprint);
    const songSchema = catalog.resolve(SongBlueprint);

    it("should hydrate one relation on root", async () => {
        // arrange
        const innerPackets: EntityStreamPacket[] = [];
        const outerPackets: EntityStreamPacket[] = [];
        const album: Album = { id: 7 };
        const songs: Song[] = [
            { id: 20, albumId: 7 },
            { id: 21, albumId: 7 },
        ];

        const hydrator = new SchemaRelationBasedHydrator(tracing, [
            {
                intercept(stream: EntityStream): EntityStream {
                    return stream.pipe(
                        switchMap(packet => {
                            innerPackets.push(packet);
                            const query = createQuery(
                                catalog,
                                SongBlueprint,
                                { albumId: [7] },
                                { id: true, albumId: true }
                            );

                            return of(
                                new EntityStreamPacket({
                                    accepted: [query],
                                    payload: [new EntitySet({ query, entities: songs })],
                                })
                            );
                        })
                    );
                },
            },
        ]);

        const source = new ReplaySubject<EntityStreamPacket<Album>>();
        const initialAcceptedQuery = queryTools
            .createIdQueryFromEntities(albumSchema, [album])
            .withSelection({ id: true });
        const initialRejectedQuery = initialAcceptedQuery.withSelection({ songs: { id: true, albumId: true } });

        // act
        const task = packetLogger.intercept(
            hydrator.intercept(source).pipe(
                tap(packet => outerPackets.push(packet)),
                shareReplay()
            )
        );

        const sourcePacket = new EntityStreamPacket({
            accepted: [initialAcceptedQuery],
            rejected: [initialRejectedQuery],
            payload: [
                new EntitySet({
                    query: initialAcceptedQuery,
                    entities: [album],
                }),
            ],
        });

        source.next(sourcePacket);

        source.complete();

        await lastValueFrom(task.pipe(defaultIfEmpty(undefined)));

        // assert
        // expect that first packet to hydration interceptor contains rejected query describing the songs relation of album entity
        const hydrationPacket = innerPackets[0];
        expectPacketEqual(
            hydrationPacket,
            new EntityStreamPacket({
                rejected: [createQuery(catalog, SongBlueprint, { albumId: [album.id] }, { id: true, albumId: true })],
            })
        );

        expect(outerPackets.length).toEqual(2); // 1st for album entity, 2nd for hydration

        // expect that first packet emitted by hydrator is the album entity, without the rejected part
        const firstEmittedPacket = outerPackets[0];
        expectPacketEqual(firstEmittedPacket, sourcePacket.withoutRejected());

        const finalEmittedPacket = outerPackets[1];
        expectPacketEqual(
            finalEmittedPacket,
            new EntityStreamPacket({
                accepted: [createQuery(catalog, AlbumBlueprint, { id: 7 }, { songs: { id: true, albumId: true } })],
                payload: [
                    new EntitySet({
                        query: createQuery(catalog, SongBlueprint, { albumId: [7] }, { id: true, albumId: true }),
                        entities: songs,
                    }),
                ],
            })
        );
    });

    it("should hydrate one relation on complex", async () => {
        // arrange
        const innerPackets: EntityStreamPacket[] = [];
        const outerPackets: EntityStreamPacket[] = [];
        const album: Album = { id: 7, metadata: { createdById: 64, updatedById: 128 } };

        // the entity loaded by hydrating album.metadata.createdBy
        const users: User[] = [
            { id: 64, name: "olaf" },
            { id: 128, name: "baelog" },
        ];
        const hydrateRelationQuery = createQuery(
            catalog,
            UserBlueprint,
            { id: users.map(user => user.id) },
            { id: true, name: true }
        );
        const hydrateRelationPacket = new EntityStreamPacket({
            accepted: [hydrateRelationQuery],
            payload: [new EntitySet({ query: hydrateRelationQuery, entities: users })],
        });

        const source = new ReplaySubject<EntityStreamPacket<Album>>();
        const initialAcceptedQuery = queryTools
            .createIdQueryFromEntities(albumSchema, [album])
            .withSelection({ id: true, metadata: { createdById: true, updatedById: true } });

        const initialRejectedQuery = initialAcceptedQuery.withSelection({
            metadata: { createdBy: { id: true, name: true }, updatedBy: { id: true, name: true } },
        });

        const hydrator = new SchemaRelationBasedHydrator(tracing, [
            createTestHydrationInterceptor(hydrateRelationPacket, innerPackets),
        ]);

        // act
        const task = packetLogger.intercept(
            hydrator.intercept(source).pipe(
                tap(packet => outerPackets.push(packet)),
                shareReplay()
            )
        );

        const sourcePacket = new EntityStreamPacket({
            accepted: [initialAcceptedQuery],
            rejected: [initialRejectedQuery],
            payload: [
                new EntitySet({
                    query: initialAcceptedQuery,
                    entities: [album],
                }),
            ],
        });

        source.next(sourcePacket);
        source.complete();

        await lastValueFrom(task.pipe(defaultIfEmpty(undefined)));

        // assert
        // expect that the packets given to hydration interceptor contain rejected queries describing the metadata.createdBy/updatedBy relations
        const firstHydrationPacket = innerPackets[0];
        expectPacketEqual(
            firstHydrationPacket,
            new EntityStreamPacket({
                rejected: [createQuery(catalog, UserBlueprint, { id: [users[0].id] }, { id: true, name: true })],
            })
        );

        const secondHydrationPacket = innerPackets[1];
        expectPacketEqual(
            secondHydrationPacket,
            new EntityStreamPacket({
                rejected: [createQuery(catalog, UserBlueprint, { id: [users[1].id] }, { id: true, name: true })],
            })
        );

        expect(outerPackets.length).toEqual(3); // 1st for album entity, 2nd & 3rd for hydration

        // expect that first packet emitted by hydrator is the album entity, without the rejected part
        const firstEmittedPacket = outerPackets[0];
        expectPacketEqual(firstEmittedPacket, sourcePacket.withoutRejected());

        // expect that second emitted packet contains hydrated metadata.createdBy relation
        expectPacketEqual(
            outerPackets[1],
            new EntityStreamPacket({
                accepted: [
                    parseQuery(
                        queryTools,
                        criteriaTools,
                        "album({ id: 7 })/{ metadata: { createdBy: { id, name } } }",
                        catalog
                    ),
                ],
                payload: [
                    new EntitySet({
                        query: parseQuery(queryTools, criteriaTools, "user({ id: { 64, 128 } })/{ id, name }", catalog),
                        entities: users,
                    }),
                ],
            })
        );

        // expect that second emitted packet contains hydrated metadata.updatedBy relation
        expectPacketEqual(
            outerPackets[2],
            new EntityStreamPacket({
                accepted: [
                    parseQuery(
                        queryTools,
                        criteriaTools,
                        "album({ id: 7 })/{ metadata: { updatedBy: { id, name } } }",
                        catalog
                    ),
                ],
                payload: [
                    new EntitySet({
                        query: parseQuery(queryTools, criteriaTools, "user({ id: { 64, 128 } })/{ id, name }", catalog),
                        entities: users,
                    }),
                ],
            })
        );
    });
});
