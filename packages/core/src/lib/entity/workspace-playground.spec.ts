import { inSet, matches, Query } from "../public";
import { createCriteriaForIndex } from "./create-criteria-for-index.fn";
import { Schema } from "./metadata/schema";
import { SchemaCatalog } from "./metadata/schema-catalog";
import { SchemaIndex } from "./metadata/schema-index";
import { SchemaJson } from "./metadata/schema-json";
import { normalizeEntities } from "./normalize-entities.fn";
import { ObjectStore } from "./object-store";
import { Workspace } from "./workspace";

describe("playground: workspace", () => {
    it("normalize items, add them to store, then query", () => {
        // arrange
        interface Foo {
            id: number;
            bar: Bar;
        }

        interface Bar {
            bazId: number;
            baz?: Baz;
        }

        interface Baz {
            id: number;
        }

        const fooSchema = new Schema({
            name: "foo",
            key: "id",
            properties: {
                bar: {
                    type: "object",
                    model: "bar",
                },
            },
        });

        const barSchema = new Schema({
            name: "bar",
            indexes: ["bazId"],
            properties: {
                baz: {
                    type: "object",
                    model: "baz",
                    link: { from: "bazId", to: "id" },
                },
            },
        });

        const bazSchema = new Schema({
            name: "baz",
            key: "id",
            properties: {},
        });

        const catalog = new SchemaCatalog([fooSchema, barSchema, bazSchema]);
        const workspace = new Workspace(catalog);

        const addedItems: Foo[] = [
            {
                id: 1337,
                bar: {
                    bazId: 128,
                    baz: {
                        id: 128,
                    },
                },
            },
        ];

        // act
        workspace.add(fooSchema.name, addedItems);

        const query: Query = {
            model: fooSchema.name,
            expansion: { bar: { baz: true } },
            criteria: matches({ id: inSet([1337]) }),
        };

        const queriedItems = workspace.query(query);

        // assert
        expect(queriedItems).toEqual(addedItems);
    });

    it("expanding", () => {
        const fooSchema = new Schema({
            name: "foo",
            key: { name: "id", path: ["id", "secondaryId"] },
            properties: {
                bar: { type: "object", model: "bar", link: { from: "id", to: "fooId" } },
            },
        });

        const barSchema = new Schema({
            name: "bar",
            key: "id",
            indexes: [{ name: "fooId", path: ["fooId", "secondaryId"] }],
            properties: {},
        });

        const catalog = new SchemaCatalog([fooSchema, barSchema]);
        const workspace = new Workspace(catalog);

        workspace.add("foo", [{ id: 1337, secondaryId: 128, name: "i am foo" }]);
        workspace.add("bar", [{ id: 64, fooId: 1337, secondaryId: 128, name: "i belong to foo" }]);

        const query: Query = {
            model: "foo",
            expansion: { bar: true },
            criteria: matches({ id: inSet([1337]), secondaryId: inSet([128]) }),
        };
        const fooItems = workspace.query(query);
        // const barItemsOfFooItems = workspace.expandResult("foo", "bar", fooItems);

        console.log("expanded foo items:", fooItems);
        // console.log("bar items:", barItemsOfFooItems);
    });

    it("expanding #2", () => {
        const fooSchema = new Schema({
            name: "foo",
            key: "id",
            properties: {
                bar: {
                    type: "object",
                    model: "bar",
                },
            },
        });

        const barSchema = new Schema({
            name: "bar",
            indexes: ["bazId"],
            properties: {
                baz: {
                    type: "object",
                    model: "baz",
                    link: { from: "bazId", to: "id" },
                },
            },
        });

        const bazSchema = new Schema({
            name: "baz",
            key: "id",
            properties: {},
        });

        const catalog = new SchemaCatalog([fooSchema, barSchema, bazSchema]);
        const workspace = new Workspace(catalog);
        workspace.add("foo", [{ id: 1337, name: "i am foo", bar: { bazId: 128 } }]);
        workspace.add("baz", [{ id: 128, name: "i am baz" }]);

        const query: Query = {
            model: "foo",
            expansion: { bar: { baz: true } },
            criteria: matches({ id: inSet([1337]) }),
        };
        const fooItems = workspace.query(query);
        // const barItemsOfFooItems = workspace.expandResult("foo", "bar", fooItems);

        console.log("expanded foo items:", fooItems);
        // console.log("bar items:", barItemsOfFooItems);
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

        const schema = new Schema({
            name: "foo",
            key: "id",
            indexes: ["bar"],
            properties: {},
        });

        const catalog = new SchemaCatalog([schema]);
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

        workspace.add(schema.name, entities);

        const query: Query = {
            model: "foo",
            criteria: matches<Foo>({ bar: inSet([2, 3]) }),
            expansion: {},
        };

        const result = workspace.query(query);

        console.log(result);
        // expect(result).toEqual(jasmine.arrayWithExactContents(expectedEntities));
        expect(result.length).toEqual(expectedEntities.length)
        expect(result).toEqual(expect.arrayContaining(expectedEntities));
    });

    it("should execute query w/ composite indexes", () => {
        interface Foo {
            id: number;
            bar: number;
            baz: number;
        }

        const schema = new Schema({
            name: "foo",
            key: "id",
            indexes: [{ name: "barAndBaz", path: ["bar", "baz"] }],
            properties: {},
        });

        const catalog = new SchemaCatalog([schema]);
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

        workspace.add(schema.name, entities);

        const query: Query = {
            model: "foo",
            criteria: matches<Foo>({ bar: inSet([2, 3]), baz: inSet([1337]) }),
            expansion: {},
        };

        const result = workspace.query(query);

        console.log(result);
        expect(result.length).toEqual(expectedEntities.length)
        expect(result).toEqual(expect.arrayContaining(expectedEntities));
    });

    it("should execute query w/ 1 nested index", () => {
        interface Foo {
            id: number;
            bar: {
                baz: number;
            };
        }

        const schema = new Schema({
            name: "foo",
            key: "id",
            indexes: [{ name: "bar", path: "bar.baz" }],
            properties: {},
        });

        const catalog = new SchemaCatalog([schema]);
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

        workspace.add(schema.name, entities);

        const query: Query = {
            model: "foo",
            criteria: matches<Foo>({ bar: matches({ baz: inSet([2, 3]) }) }),
            expansion: {},
        };

        const result = workspace.query(query);

        console.log(result);
        // expect(result).toEqual(jasmine.arrayWithExactContents(expectedEntities));
        expect(result.length).toEqual(expectedEntities.length)
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

        const schema = new Schema({
            name: "foo",
            key: "id",
            properties: {},
            indexes: [{ name: "bar", path: ["bar.baz", "bar.moo"] }],
        });

        const catalog = new SchemaCatalog([schema]);
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

        workspace.add(schema.name, entities);

        const query: Query = {
            model: "foo",
            criteria: matches<Foo>({ bar: matches({ baz: inSet([2, 3]), moo: inSet([10]) }) }),
            expansion: {},
        };

        const result = workspace.query(query);

        console.log(result);
        // expect(result).toEqual(jasmine.arrayWithExactContents(expectedEntities));
        expect(result.length).toEqual(expectedEntities.length)
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

        const schema = new Schema({
            name: "foo",
            key: "id",
            properties: {},
            indexes: [{ name: "bar", path: ["bar.baz", "bar.moo", "khaz.mo", "khaz.dan"] }],
        });

        const catalog = new SchemaCatalog([schema]);
        const workspace = new Workspace(catalog);

        const entities: Foo[] = [
            { id: 1, bar: { baz: 2, moo: 10 }, khaz: { mo: 1, dan: 2 } },
            { id: 2, bar: { baz: 3, moo: 10 }, khaz: { mo: 1, dan: 3 } },
            { id: 3, bar: { baz: 2, moo: 5 }, khaz: { mo: 1, dan: 2 } },
            { id: 4, bar: { baz: 1, moo: 5 }, khaz: { mo: 1, dan: 2 } },
        ];

        const expectedEntities = [{ id: 1, bar: { baz: 2, moo: 10 }, khaz: { mo: 1, dan: 2 } }];

        workspace.add(schema.name, entities);

        const query: Query = {
            model: "foo",
            criteria: matches<Foo>({
                bar: matches({ baz: inSet([2, 3]), moo: inSet([10]) }),
                khaz: matches({ mo: inSet([1]), dan: inSet([2]) }),
            }),
            expansion: {},
        };

        const result = workspace.query(query);

        console.log(result);
        // expect(result).toEqual(jasmine.arrayWithExactContents(expectedEntities));
        expect(result.length).toEqual(expectedEntities.length)
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
