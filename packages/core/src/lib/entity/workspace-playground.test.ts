import { inSet, matches } from "@entity-space/criteria";
import { Query } from "../query/public";
import { EntitySchema } from "../schema/entity-schema";
import { Workspace } from "./workspace";

describe("playground: workspace", () => {
    it("should execute query w/ 1 simple index", async () => {
        interface Foo {
            bar: number;
            id: number;
        }

        const schema = new EntitySchema("foo");
        schema.setKey("id");
        schema.addIndex("bar");

        const workspace = new Workspace();

        const entities: Foo[] = [
            { id: 1, bar: 2 },
            { id: 2, bar: 3 },
            { id: 3, bar: 2 },
            { id: 4, bar: 1 },
        ];

        const expectedEntities = [
            { id: 1, bar: 2 },
            { id: 2, bar: 3 },
            { id: 3, bar: 2 },
        ];

        workspace.add(schema, entities);

        const query = new Query(schema, matches<Foo>({ bar: inSet([2, 3]) }));
        const result = await workspace.queryAgainstCache(query);

        expect(result.length).toEqual(expectedEntities.length);
        expect(result).toEqual(expect.arrayContaining(expectedEntities));
    });

    it("should execute query w/ composite indexes", async () => {
        interface Foo {
            bar: number;
            baz: number;
            id: number;
        }

        const schema = new EntitySchema("foo");
        schema.setKey("id");
        schema.addIndex(["bar", "baz"], { name: "barAndBaz" });

        const workspace = new Workspace();

        const entities: Foo[] = [
            { id: 1, bar: 2, baz: 1337 },
            { id: 2, bar: 3, baz: 1337 },
            { id: 3, bar: 2, baz: 64 },
            { id: 4, bar: 1, baz: 1337 },
        ];

        const expectedEntities = [
            { id: 1, bar: 2, baz: 1337 },
            { id: 2, bar: 3, baz: 1337 },
        ];

        workspace.add(schema, entities);

        const query = new Query(schema, matches<Foo>({ bar: inSet([2, 3]), baz: inSet([1337]) }));
        const result = await workspace.queryAgainstCache(query);

        expect(result.length).toEqual(expectedEntities.length);
        expect(result).toEqual(expect.arrayContaining(expectedEntities));
    });

    it("should execute query w/ 1 nested index", async () => {
        interface Foo {
            bar: {
                baz: number;
            };
            id: number;
        }

        const schema = new EntitySchema("foo");
        schema.setKey("id");
        schema.addIndex("bar.baz");

        const workspace = new Workspace();

        const entities: Foo[] = [
            { id: 1, bar: { baz: 2 } },
            { id: 2, bar: { baz: 3 } },
            { id: 3, bar: { baz: 2 } },
            { id: 4, bar: { baz: 1 } },
        ];

        const expectedEntities = [
            { id: 1, bar: { baz: 2 } },
            { id: 2, bar: { baz: 3 } },
            { id: 3, bar: { baz: 2 } },
        ];

        workspace.add(schema, entities);

        const query = new Query(schema, matches<Foo>({ bar: matches({ baz: inSet([2, 3]) }) }));
        const result = await workspace.queryAgainstCache(query);

        expect(result.length).toEqual(expectedEntities.length);
        expect(result).toEqual(expect.arrayContaining(expectedEntities));
    });

    it("should execute query w/ composite nested index", async () => {
        interface Foo {
            bar: {
                baz: number;
                moo: number;
            };
            id: number;
        }

        const schema = new EntitySchema("foo");
        schema.setKey("id");
        schema.addIndex(["bar.baz", "bar.moo"], { name: "bar" });

        const workspace = new Workspace();

        const entities: Foo[] = [
            { id: 1, bar: { baz: 2, moo: 10 } },
            { id: 2, bar: { baz: 3, moo: 10 } },
            { id: 3, bar: { baz: 2, moo: 5 } },
            { id: 4, bar: { baz: 1, moo: 5 } },
        ];

        const expectedEntities = [
            { id: 1, bar: { baz: 2, moo: 10 } },
            { id: 2, bar: { baz: 3, moo: 10 } },
        ];

        workspace.add(schema, entities);

        const query = new Query(schema, matches<Foo>({ bar: matches({ baz: inSet([2, 3]), moo: inSet([10]) }) }));
        const result = await workspace.queryAgainstCache(query);

        expect(result.length).toEqual(expectedEntities.length);
        expect(result).toEqual(expect.arrayContaining(expectedEntities));
    });

    it("should execute query w/ composite distributed nested index", async () => {
        interface Foo {
            bar: {
                baz: number;
                moo: number;
            };
            id: number;
            khaz: {
                mo: number;
                dan: number;
            };
        }

        const schema = new EntitySchema("foo");
        schema.setKey("id");
        schema.addIndex(["bar.baz", "bar.moo", "khaz.mo", "khaz.dan"], { name: "bar" });

        const workspace = new Workspace();

        const entities: Foo[] = [
            { id: 1, bar: { baz: 2, moo: 10 }, khaz: { mo: 1, dan: 2 } },
            { id: 2, bar: { baz: 3, moo: 10 }, khaz: { mo: 1, dan: 3 } },
            { id: 3, bar: { baz: 2, moo: 5 }, khaz: { mo: 1, dan: 2 } },
            { id: 4, bar: { baz: 1, moo: 5 }, khaz: { mo: 1, dan: 2 } },
        ];

        const expectedEntities = [{ id: 1, bar: { baz: 2, moo: 10 }, khaz: { mo: 1, dan: 2 } }];

        workspace.add(schema, entities);

        const query = new Query(
            schema,
            matches<Foo>({
                bar: matches({ baz: inSet([2, 3]), moo: inSet([10]) }),
                khaz: matches({ mo: inSet([1]), dan: inSet([2]) }),
            })
        );

        const result = await workspace.queryAgainstCache(query);

        expect(result.length).toEqual(expectedEntities.length);
        expect(result).toEqual(expect.arrayContaining(expectedEntities));
    });

    it("expanding", async () => {
        const fooSchema = new EntitySchema("foo");
        fooSchema.setKey(["id", "secondaryId"]);

        const barSchema = new EntitySchema("bar");
        barSchema.setKey("id");
        barSchema.addIndex(["fooId", "secondaryId"], { name: "fooId" });

        fooSchema.addProperty("bar", barSchema);
        // [todo] unintuitive usage of auto computed index name
        fooSchema.addRelation("bar", "id,secondaryId", "fooId");

        const workspace = new Workspace();

        workspace.add(fooSchema, [{ id: 1337, secondaryId: 128, name: "i am foo" }]);
        workspace.add(barSchema, [{ id: 64, fooId: 1337, secondaryId: 128, name: "i belong to foo" }]);

        const query = new Query(fooSchema, matches({ id: inSet([1337]), secondaryId: inSet([128]) }), { bar: true });
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

    it("expanding #2", async () => {
        const fooSchema = new EntitySchema("foo");
        fooSchema.setKey("id");

        const barSchema = new EntitySchema("bar");
        barSchema.addIndex("bazId");

        const bazSchema = new EntitySchema("baz");
        bazSchema.setKey("id");

        barSchema.addProperty("baz", bazSchema);
        barSchema.addRelation("baz", "bazId", "id");
        fooSchema.addProperty("bar", barSchema);

        const workspace = new Workspace();
        workspace.add(fooSchema, [{ id: 1337, name: "i am foo", bar: { bazId: 128 } }]);
        workspace.add(bazSchema, [{ id: 128, name: "i am baz" }]);

        const query = new Query(fooSchema, matches({ id: inSet([1337]) }), { bar: { baz: true } });
        const fooItems = await workspace.queryAgainstCache(query);

        expect(fooItems).toEqual([
            { id: 1337, name: "i am foo", bar: { bazId: 128, baz: { id: 128, name: "i am baz" } } },
        ]);
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

        const fooSchema = new EntitySchema("foo");
        fooSchema.setKey("id");
        fooSchema.addIndex("barId");
        fooSchema.addRelation("bar", "barId", "id");

        const barSchema = new EntitySchema("bar");
        barSchema.setKey("id");
        barSchema.addIndex("bazId");
        barSchema.addRelation("baz", "bazId", "id");
        fooSchema.addProperty("bar", barSchema);

        const bazSchema = new EntitySchema("baz");
        bazSchema.setKey("id");

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
});
