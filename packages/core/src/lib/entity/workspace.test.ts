import { inSet, matches } from "@entity-space/criteria";
import { firstValueFrom, take, tap, toArray } from "rxjs";
import { Query } from "../query/public";
import { EntitySchema } from "../schema/entity-schema";
import { Workspace } from "./workspace";

describe("workspace", () => {
    describe("queryAgainstCache()", () => {
        it("should execute query w/ 1 simple index", async () => {
            // arrange
            interface Entity {
                id: number;
                bar: number;
            }

            const schema = new EntitySchema("foo").setKey("id").addIndex("bar");
            const workspace = new Workspace();

            const entities: Entity[] = [
                { id: 1, bar: 2 },
                { id: 2, bar: 3 },
                { id: 3, bar: 2 },
                { id: 4, bar: 1 },
            ];

            const expectedEntities: Entity[] = [
                { id: 1, bar: 2 },
                { id: 2, bar: 3 },
                { id: 3, bar: 2 },
            ];

            workspace.add(schema, entities);

            // act
            const query = new Query(schema, matches<Entity>({ bar: inSet([2, 3]) }));
            const result = await workspace.queryAgainstCache(query);

            // assert
            expect(result.length).toEqual(expectedEntities.length);
            expect(result).toEqual(expect.arrayContaining(expectedEntities));
        });

        it("should execute query w/ 1 composite index", async () => {
            // arrange
            interface Entity {
                id: number;
                bar: number;
                baz: number;
            }

            const schema = new EntitySchema("foo").setKey("id").addIndex(["bar", "baz"], { name: "barAndBaz" });
            const workspace = new Workspace();

            const entities: Entity[] = [
                { id: 1, bar: 2, baz: 1337 },
                { id: 2, bar: 3, baz: 1337 },
                { id: 3, bar: 2, baz: 64 },
                { id: 4, bar: 1, baz: 1337 },
            ];

            const expectedEntities: Entity[] = [
                { id: 1, bar: 2, baz: 1337 },
                { id: 2, bar: 3, baz: 1337 },
            ];

            workspace.add(schema, entities);

            // act
            const query = new Query(schema, matches<Entity>({ bar: inSet([2, 3]), baz: inSet([1337]) }));
            const result = await workspace.queryAgainstCache(query);

            // assert
            expect(result.length).toEqual(expectedEntities.length);
            expect(result).toEqual(expect.arrayContaining(expectedEntities));
        });

        it("should execute query w/ 1 nested index", async () => {
            // arrange
            interface Entity {
                id: number;
                bar: { baz: number };
            }

            const schema = new EntitySchema("foo").setKey("id").addIndex("bar.baz");
            const workspace = new Workspace();

            const entities: Entity[] = [
                { id: 1, bar: { baz: 2 } },
                { id: 2, bar: { baz: 3 } },
                { id: 3, bar: { baz: 2 } },
                { id: 4, bar: { baz: 1 } },
            ];

            const expectedEntities: Entity[] = [
                { id: 1, bar: { baz: 2 } },
                { id: 2, bar: { baz: 3 } },
                { id: 3, bar: { baz: 2 } },
            ];

            workspace.add(schema, entities);

            // act
            const query = new Query(schema, matches<Entity>({ bar: matches({ baz: inSet([2, 3]) }) }));
            const result = await workspace.queryAgainstCache(query);

            // assert
            expect(result.length).toEqual(expectedEntities.length);
            expect(result).toEqual(expect.arrayContaining(expectedEntities));
        });

        it("should execute query w/ 1 composite nested index", async () => {
            // arrange
            interface Entity {
                id: number;
                bar: {
                    baz: number;
                    moo: number;
                };
            }

            const schema = new EntitySchema("foo").setKey("id").addIndex(["bar.baz", "bar.moo"], { name: "bar" });
            const workspace = new Workspace();

            const entities: Entity[] = [
                { id: 1, bar: { baz: 2, moo: 10 } },
                { id: 2, bar: { baz: 3, moo: 10 } },
                { id: 3, bar: { baz: 2, moo: 5 } },
                { id: 4, bar: { baz: 1, moo: 5 } },
            ];

            const expectedEntities: Entity[] = [
                { id: 1, bar: { baz: 2, moo: 10 } },
                { id: 2, bar: { baz: 3, moo: 10 } },
            ];

            workspace.add(schema, entities);

            // act
            const query = new Query(
                schema,
                matches<Entity>({ bar: matches({ baz: inSet([2, 3]), moo: inSet([10]) }) })
            );
            const result = await workspace.queryAgainstCache(query);

            // assert
            expect(result.length).toEqual(expectedEntities.length);
            expect(result).toEqual(expect.arrayContaining(expectedEntities));
        });

        it("should execute query w/ 1 composite distributed nested index", async () => {
            // arrange
            interface Entity {
                id: number;
                bar: {
                    baz: number;
                    moo: number;
                };
                khaz: {
                    mo: number;
                    dan: number;
                };
            }

            const schema = new EntitySchema("foo")
                .setKey("id")
                .addIndex(["bar.baz", "bar.moo", "khaz.mo", "khaz.dan"], { name: "bar" });

            const workspace = new Workspace();

            const entities: Entity[] = [
                { id: 1, bar: { baz: 2, moo: 10 }, khaz: { mo: 1, dan: 2 } },
                { id: 2, bar: { baz: 3, moo: 10 }, khaz: { mo: 1, dan: 3 } },
                { id: 3, bar: { baz: 2, moo: 5 }, khaz: { mo: 1, dan: 2 } },
                { id: 4, bar: { baz: 1, moo: 5 }, khaz: { mo: 1, dan: 2 } },
            ];

            const expectedEntities: Entity[] = [{ id: 1, bar: { baz: 2, moo: 10 }, khaz: { mo: 1, dan: 2 } }];

            workspace.add(schema, entities);

            // act
            const query = new Query(
                schema,
                matches<Entity>({
                    bar: matches({ baz: inSet([2, 3]), moo: inSet([10]) }),
                    khaz: matches({ mo: inSet([1]), dan: inSet([2]) }),
                })
            );

            const result = await workspace.queryAgainstCache(query);

            // assert
            expect(result.length).toEqual(expectedEntities.length);
            expect(result).toEqual(expect.arrayContaining(expectedEntities));
        });
    });

    describe("expansions", () => {
        it("expanding on 1x composite index", async () => {
            const fooSchema = new EntitySchema("foo").setKey(["id", "secondaryId"]);
            const barSchema = new EntitySchema("bar")
                .setKey("id")
                .addIndex(["fooId", "secondaryId"], { name: "fooId" });

            fooSchema.addProperty("bar", barSchema);
            // [todo] unintuitive usage of auto computed index name
            fooSchema.addRelation("bar", "id,secondaryId", "fooId");

            const workspace = new Workspace();

            workspace.add(fooSchema, [{ id: 1337, secondaryId: 128, name: "i am foo" }]);
            workspace.add(barSchema, [{ id: 64, fooId: 1337, secondaryId: 128, name: "i belong to foo" }]);

            const query = new Query(fooSchema, matches({ id: inSet([1337]), secondaryId: inSet([128]) }), {
                bar: true,
            });
            const fooItems = await workspace.queryAgainstCache(query);

            expect(fooItems).toEqual([
                {
                    id: 1337,
                    secondaryId: 128,
                    name: "i am foo",
                    bar: { id: 64, fooId: 1337, secondaryId: 128, name: "i belong to foo" },
                },
            ]);
        });

        // [todo] i need a less confusing name for entities that are contained in other entities,
        // but are not part of a relation, i.e. not normalized/joinable/...
        it("expanding on a relation of an entity which itself is not related", async () => {
            // arrange
            const fooSchema = new EntitySchema("foo").setKey("id");
            const barSchema = new EntitySchema("bar").addIndex("bazId");
            const bazSchema = new EntitySchema("baz").setKey("id");
            barSchema.addProperty("baz", bazSchema);
            barSchema.addRelation("baz", "bazId", "id");
            fooSchema.addProperty("bar", barSchema);

            const workspace = new Workspace();
            workspace.add(fooSchema, [{ id: 1337, name: "i am foo", bar: { bazId: 128 } }]);
            workspace.add(bazSchema, [{ id: 128, name: "i am baz" }]);

            // act
            const query = new Query(fooSchema, matches({ id: inSet([1337]) }), { bar: { baz: true } });
            const fooItems = await workspace.queryAgainstCache(query);

            // assert
            expect(fooItems).toEqual([
                { id: 1337, name: "i am foo", bar: { bazId: 128, baz: { id: 128, name: "i am baz" } } },
            ]);
        });
    });

    it("normalize items, add them to store, then query", async () => {
        // arrange
        interface Foo {
            bar: Bar;
            barId: number;
            id: number;
        }

        interface Bar {
            baz?: Baz;
            bazId: number;
            id: number;
        }

        interface Baz {
            id: number;
        }

        const fooSchema = new EntitySchema("foo").setKey("id").addIndex("barId").addRelation("bar", "barId", "id");
        const barSchema = new EntitySchema("bar").setKey("id").addIndex("bazId").addRelation("baz", "bazId", "id");
        fooSchema.addProperty("bar", barSchema);
        const bazSchema = new EntitySchema("baz").setKey("id");
        barSchema.addProperty("baz", bazSchema);

        const workspace = new Workspace();

        const addedItems: Foo[] = [
            {
                id: 1337,
                barId: 64,
                bar: {
                    id: 64,
                    bazId: 128,
                    baz: {
                        id: 128,
                    },
                },
            },
        ];

        // act
        workspace.add(fooSchema, addedItems);

        const query = new Query(fooSchema, matches({ id: inSet([1337]) }), { bar: { baz: true } });
        const queriedItems = await workspace.queryAgainstCache(query);

        // assert
        expect(queriedItems).toEqual(addedItems);
    });

    describe("reactive queries", () => {
        const timeout = 100;

        it(
            "should work #1",
            async () => {
                // arrange
                interface Entity {
                    id: number;
                    name: string;
                }

                const entitySchema = new EntitySchema("foo").setKey("id");
                const workspace = new Workspace();
                const entities: Entity[] = [
                    { id: 1, name: "one" },
                    { id: 2, name: "two" },
                ];
                const changes: Partial<Entity>[] = [
                    {
                        id: 1,
                        name: "one (update)",
                    },
                ];
                const expectedEntities: Entity[] = [
                    { id: 1, name: "one (update)" },
                    { id: 2, name: "two" },
                ];
                workspace.add<Entity>(entitySchema, entities);

                // act / assert
                let index = 0;
                const actual = await firstValueFrom(
                    workspace.query$<Entity>(entitySchema, { id: inSet([1, 2]) }).pipe(
                        tap(() => workspace.add<Entity>(entitySchema, changes[index++] ?? [])),
                        take(changes.length + 1),
                        toArray()
                    )
                );

                expect(actual).toEqual([entities, expectedEntities]);
            },
            timeout
        );
    });
});
