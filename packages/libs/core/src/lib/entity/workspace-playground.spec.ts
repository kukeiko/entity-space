import { inSet, matches, Query } from "../public";
import { EntitySpaceSchema } from "../schema/entity-space-schema";
import { UnbakedSchemaCatalog } from "../schema/unbaked-schema-catalog";
import { Workspace } from "./workspace";

describe("playground: workspace", () => {
    it("normalize items, add them to store, then query", () => {
        // arrange
        interface Foo {
            id: number;
            barId: number;
            bar: Bar;
        }

        interface Bar {
            id: number;
            bazId: number;
            baz?: Baz;
        }

        interface Baz {
            id: number;
        }

        const fooSchema: EntitySpaceSchema = {
            $id: "foo",
            type: "object",
            key: "id",
            properties: {
                bar: {
                    $ref: "bar",
                },
            },
            indexes: {
                barId: {
                    path: ["barId"],
                },
            },
            relations: {
                bar: ["barId", "id"],
            },
        };

        const barSchema: EntitySpaceSchema = {
            $id: "bar",
            type: "object",
            key: "id",
            properties: {
                bazId: {
                    type: "number",
                },
                baz: {
                    $ref: "baz",
                },
            },
            indexes: {
                bazId: {
                    path: ["bazId"],
                },
            },
            relations: { baz: ["bazId", "id"] },
        };

        const bazSchema: EntitySpaceSchema = {
            $id: "baz",
            type: "object",
            key: "id",
        };

        const catalog = new UnbakedSchemaCatalog();
        catalog.addSchema(fooSchema);
        catalog.addSchema(barSchema);
        catalog.addSchema(bazSchema);

        const workspace = new Workspace(catalog);

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
        workspace.add("foo", addedItems);

        const query: Query = {
            model: "foo",
            expansion: { bar: { baz: true } },
            criteria: matches({ id: inSet([1337]) }),
        };

        const queriedItems = workspace.query(query);

        // assert
        expect(queriedItems).toEqual(addedItems);
    });

    it("expanding", () => {
        const fooSchema: EntitySpaceSchema = {
            $id: "foo",
            type: "object",
            key: ["id", "secondaryId"],
            properties: {
                bar: { type: "object", $ref: "bar" },
            },
            relations: { bar: ["id,secondaryId", "fooId"] },
        };

        const barSchema: EntitySpaceSchema = {
            $id: "bar",
            type: "object",
            key: "id",
            indexes: { fooId: { path: ["fooId", "secondaryId"] } },
            properties: {},
        };

        const catalog = new UnbakedSchemaCatalog();
        catalog.addSchema(fooSchema);
        catalog.addSchema(barSchema);
        const workspace = new Workspace(catalog);

        workspace.add("foo", [{ id: 1337, secondaryId: 128, name: "i am foo" }]);
        workspace.add("bar", [{ id: 64, fooId: 1337, secondaryId: 128, name: "i belong to foo" }]);

        const query: Query = {
            model: "foo",
            expansion: { bar: true },
            criteria: matches({ id: inSet([1337]), secondaryId: inSet([128]) }),
        };
        const fooItems = workspace.query(query);

        expect(fooItems).toEqual([
            {
                id: 1337,
                secondaryId: 128,
                name: "i am foo",
                bar: { id: 64, fooId: 1337, secondaryId: 128, name: "i belong to foo" },
            },
        ]);
    });

    it("expanding #2", () => {
        const fooSchema: EntitySpaceSchema = {
            $id: "foo",
            type: "object",
            key: "id",
            properties: {
                bar: {
                    $ref: "bar",
                },
            },
        };

        const barSchema: EntitySpaceSchema = {
            $id: "bar",
            type: "object",
            indexes: {
                bazId: {
                    path: ["bazId"],
                },
            },
            properties: {
                baz: {
                    $ref: "baz",
                },
            },
            relations: { baz: ["bazId", "id"] },
        };

        const bazSchema: EntitySpaceSchema = {
            $id: "baz",
            type: "object",
            key: "id",
        };

        const catalog = new UnbakedSchemaCatalog();
        catalog.addSchema(fooSchema);
        catalog.addSchema(barSchema);
        catalog.addSchema(bazSchema);

        const workspace = new Workspace(catalog);
        workspace.add("foo", [{ id: 1337, name: "i am foo", bar: { bazId: 128 } }]);
        workspace.add("baz", [{ id: 128, name: "i am baz" }]);

        const query: Query = {
            model: "foo",
            expansion: { bar: { baz: true } },
            criteria: matches({ id: inSet([1337]) }),
        };

        const fooItems = workspace.query(query);

        expect(fooItems).toEqual([
            { id: 1337, name: "i am foo", bar: { bazId: 128, baz: { id: 128, name: "i am baz" } } },
        ]);
    });

    xit("squawking around", () => {
        // const schema: SchemaJson = {} as any;
        // for (const key in schema.properties) {
        //     const property = schema.properties[key];
        // }
        // const workspace = new Workspace();
        // const store = new ObjectStore(new Schema({ name: "foo", key: "id", indexes: ["bar"], properties: {} }));
        // workspace.addStore(store);
        // const criteria = createCriteriaForIndex(["bar"], [1, 2, 3]);
        // console.log(criteria);
        // workspace.addStore(new ObjectStore(new Schema({ name: "bar", key: "id", properties: {}, indexes: [{ name: "baz", path: ["khaz.mo", "foo", "khaz.dan"] }] })));
        // const barCriteria = createCriteriaForIndex(
        //     ["khaz.mo", "foo", "khaz.dan"],
        //     [
        //         [1337, 64, 1],
        //         [42, 64, 2],
        //         [1337, 128, 1],
        //         [1337, 64, 2],
        //         [42, 128, 1],
        //         [42, 64, 2],
        //         [1337, 64, 1],
        //         [1337, 128, 1],
        //     ]
        // );
        // console.log(barCriteria);
    });

    it("should execute query w/ 1 simple index", () => {
        interface Foo {
            id: number;
            bar: number;
        }

        const schema: EntitySpaceSchema = {
            $id: "foo",
            key: "id",
            indexes: { bar: true },
            properties: {},
        };

        const catalog = new UnbakedSchemaCatalog();
        catalog.addSchema(schema);
        const workspace = new Workspace(catalog);

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

        workspace.add("foo", entities);

        const query: Query = {
            model: "foo",
            criteria: matches<Foo>({ bar: inSet([2, 3]) }),
            expansion: {},
        };

        const result = workspace.query(query);

        expect(result.length).toEqual(expectedEntities.length);
        expect(result).toEqual(expect.arrayContaining(expectedEntities));
    });

    it("should execute query w/ composite indexes", () => {
        interface Foo {
            id: number;
            bar: number;
            baz: number;
        }

        const schema: EntitySpaceSchema = {
            $id: "foo",
            key: "id",
            indexes: { barAndBaz: ["bar", "baz"] },
            properties: {},
        };

        const catalog = new UnbakedSchemaCatalog();
        catalog.addSchema(schema);
        const workspace = new Workspace(catalog);

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

        workspace.add("foo", entities);

        const query: Query = {
            model: "foo",
            criteria: matches<Foo>({ bar: inSet([2, 3]), baz: inSet([1337]) }),
            expansion: {},
        };

        const result = workspace.query(query);

        expect(result.length).toEqual(expectedEntities.length);
        expect(result).toEqual(expect.arrayContaining(expectedEntities));
    });

    it("should execute query w/ 1 nested index", () => {
        interface Foo {
            id: number;
            bar: {
                baz: number;
            };
        }

        const schema: EntitySpaceSchema = {
            $id: "foo",
            key: "id",
            indexes: { bar: "bar.baz" },
            properties: {},
        };

        const catalog = new UnbakedSchemaCatalog();
        catalog.addSchema(schema);
        const workspace = new Workspace(catalog);

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

        workspace.add("foo", entities);

        const query: Query = {
            model: "foo",
            criteria: matches<Foo>({ bar: matches({ baz: inSet([2, 3]) }) }),
            expansion: {},
        };

        const result = workspace.query(query);

        expect(result.length).toEqual(expectedEntities.length);
        expect(result).toEqual(expect.arrayContaining(expectedEntities));
    });

    it("should execute query w/ composite nested index", () => {
        interface Foo {
            id: number;
            bar: {
                baz: number;
                moo: number;
            };
        }

        const schema: EntitySpaceSchema = {
            $id: "foo",
            key: "id",
            properties: {},
            indexes: { bar: ["bar.baz", "bar.moo"] },
        };

        const catalog = new UnbakedSchemaCatalog();
        catalog.addSchema(schema);
        const workspace = new Workspace(catalog);

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

        workspace.add("foo", entities);

        const query: Query = {
            model: "foo",
            criteria: matches<Foo>({ bar: matches({ baz: inSet([2, 3]), moo: inSet([10]) }) }),
            expansion: {},
        };

        const result = workspace.query(query);

        expect(result.length).toEqual(expectedEntities.length);
        expect(result).toEqual(expect.arrayContaining(expectedEntities));
    });

    it("should execute query w/ composite distributed nested index", () => {
        interface Foo {
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

        const schema: EntitySpaceSchema = {
            $id: "foo",
            key: "id",
            properties: {},
            indexes: { bar: ["bar.baz", "bar.moo", "khaz.mo", "khaz.dan"] },
        };

        const catalog = new UnbakedSchemaCatalog();
        catalog.addSchema(schema);
        const workspace = new Workspace(catalog);

        const entities: Foo[] = [
            { id: 1, bar: { baz: 2, moo: 10 }, khaz: { mo: 1, dan: 2 } },
            { id: 2, bar: { baz: 3, moo: 10 }, khaz: { mo: 1, dan: 3 } },
            { id: 3, bar: { baz: 2, moo: 5 }, khaz: { mo: 1, dan: 2 } },
            { id: 4, bar: { baz: 1, moo: 5 }, khaz: { mo: 1, dan: 2 } },
        ];

        const expectedEntities = [{ id: 1, bar: { baz: 2, moo: 10 }, khaz: { mo: 1, dan: 2 } }];

        workspace.add("foo", entities);

        const query: Query = {
            model: "foo",
            criteria: matches<Foo>({
                bar: matches({ baz: inSet([2, 3]), moo: inSet([10]) }),
                khaz: matches({ mo: inSet([1]), dan: inSet([2]) }),
            }),
            expansion: {},
        };

        const result = workspace.query(query);

        expect(result.length).toEqual(expectedEntities.length);
        expect(result).toEqual(expect.arrayContaining(expectedEntities));
    });

    xit("indexeddb interface looky looky stuff", () => {
        const db: IDBDatabase = {} as any;
        // db.transaction().
        const myStore = db.createObjectStore("foo", {});
        const myIndex = myStore.createIndex("", "", { multiEntry: true });

        myIndex.get(["foo", 1, [[3]]]);
        myStore.openCursor();
        myStore.delete;

        // myStore.index("foo").k
        // myStore.indexNames
    });
});
