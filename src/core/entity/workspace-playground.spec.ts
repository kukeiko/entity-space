import { inSet, matches, Query } from "../public";
import { Schema } from "./metadata/schema";
import { SchemaIndex } from "./metadata/schema-index";
import { SchemaJson } from "./metadata/schema-json";
import { ObjectStore } from "./object-store";
import { Workspace } from "./workspace";

describe("playground: workspace", () => {
    it("normalize", () => {
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

        const workspace = new Workspace();
        workspace.addSchemaAndStore(fooSchema);
        workspace.addSchema(barSchema);
        workspace.addSchemaAndStore(bazSchema);

        const items: Foo[] = [
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

        const normalized = workspace.normalize(fooSchema.name, items);

        for (const model in normalized) {
            workspace.addItems(model, normalized[model]);
        }

        const query: Query = { model: "foo", expansion: { bar: { baz: true } }, criteria: matches({ id: inSet([1337]) }) };
        const fooItems = workspace.executeQuery(query);
        // const barItemsOfFooItems = workspace.expandResult("foo", "bar", fooItems);

        expect(fooItems).toEqual(items);
        console.log("expanded foo items:", fooItems);
        // console.log("bar items:", barItemsOfFooItems);
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

        const workspace = new Workspace();
        workspace.addSchemaAndStore(fooSchema);
        workspace.addSchemaAndStore(barSchema);
        workspace.addItems("foo", [{ id: 1337, secondaryId: 128, name: "i am foo" }]);
        workspace.addItems("bar", [{ id: 64, fooId: 1337, secondaryId: 128, name: "i belong to foo" }]);

        const query: Query = { model: "foo", expansion: { bar: true }, criteria: matches({ id: inSet([1337]), secondaryId: inSet([128]) }) };
        const fooItems = workspace.executeQuery(query);
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

        const workspace = new Workspace();
        workspace.addSchemaAndStore(fooSchema);
        workspace.addSchema(barSchema);
        workspace.addSchemaAndStore(bazSchema);
        workspace.addItems("foo", [{ id: 1337, name: "i am foo", bar: { bazId: 128 } }]);
        workspace.addItems("baz", [{ id: 128, name: "i am baz" }]);

        const query: Query = { model: "foo", expansion: { bar: { baz: true } }, criteria: matches({ id: inSet([1337]) }) };
        const fooItems = workspace.executeQuery(query);
        // const barItemsOfFooItems = workspace.expandResult("foo", "bar", fooItems);

        console.log("expanded foo items:", fooItems);
        // console.log("bar items:", barItemsOfFooItems);
    });

    xit("squawking around", () => {
        const schema: SchemaJson = {} as any;
        for (const key in schema.properties) {
            const property = schema.properties[key];
        }
        const workspace = new Workspace();

        const store = new ObjectStore(new Schema({ name: "foo", key: "id", indexes: ["bar"], properties: {} }));
        workspace.addStore(store);
        const criteria = workspace.createCriteriaForIndex("foo", "bar", [1, 2, 3]);
        console.log(criteria);
        workspace.addStore(new ObjectStore(new Schema({ name: "bar", key: "id", properties: {}, indexes: [{ name: "baz", path: ["khaz.mo", "foo", "khaz.dan"] }] })));
        const barCriteria = workspace.createCriteriaForIndex("bar", "baz", [
            [1337, 64, 1],
            [42, 64, 2],
            [1337, 128, 1],
            [1337, 64, 2],
            [42, 128, 1],
            [42, 64, 2],
            [1337, 64, 1],
            [1337, 128, 1],
        ]);
        console.log(barCriteria);
    });

    it("should execute query w/ 1 simple index", () => {
        interface Foo {
            id: number;
            bar: number;
        }

        const workspace = new Workspace();
        const schema = new Schema({
            name: "foo",
            key: "id",
            indexes: ["bar"],
            properties: {},
        });

        // const store = new ObjectStore("foo", ["id"], { bar: { path: ["bar"] } });
        const store = new ObjectStore(schema);
        workspace.addStore(store);

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

        store.add(entities);

        const query: Query = {
            model: "foo",
            criteria: matches<Foo>({ bar: inSet([2, 3]) }),
            expansion: {},
        };

        const result = workspace.executeQuery(query);

        console.log(result);
        expect(result).toEqual(jasmine.arrayWithExactContents(expectedEntities));
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

        const store = new ObjectStore(schema);
        const workspace = new Workspace();
        workspace.addStore(store);

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

        store.add(entities);

        const query: Query = {
            model: "foo",
            criteria: matches<Foo>({ bar: inSet([2, 3]), baz: inSet([1337]) }),
            expansion: {},
        };

        const result = workspace.executeQuery(query);

        console.log(result);
        expect(result).toEqual(jasmine.arrayWithExactContents(expectedEntities));
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

        const store = new ObjectStore(schema);
        const workspace = new Workspace();
        workspace.addStore(store);

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

        store.add(entities);

        const query: Query = {
            model: "foo",
            criteria: matches<Foo>({ bar: matches({ baz: inSet([2, 3]) }) }),
            expansion: {},
        };

        const result = workspace.executeQuery(query);

        console.log(result);
        expect(result).toEqual(jasmine.arrayWithExactContents(expectedEntities));
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

        const store = new ObjectStore(schema);
        const workspace = new Workspace();
        workspace.addStore(store);

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

        store.add(entities);

        const query: Query = {
            model: "foo",
            criteria: matches<Foo>({ bar: matches({ baz: inSet([2, 3]), moo: inSet([10]) }) }),
            expansion: {},
        };

        const result = workspace.executeQuery(query);

        console.log(result);
        expect(result).toEqual(jasmine.arrayWithExactContents(expectedEntities));
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

        const store = new ObjectStore(schema);
        const workspace = new Workspace();
        workspace.addStore(store);

        const entities: Foo[] = [
            { id: 1, bar: { baz: 2, moo: 10 }, khaz: { mo: 1, dan: 2 } },
            { id: 2, bar: { baz: 3, moo: 10 }, khaz: { mo: 1, dan: 3 } },
            { id: 3, bar: { baz: 2, moo: 5 }, khaz: { mo: 1, dan: 2 } },
            { id: 4, bar: { baz: 1, moo: 5 }, khaz: { mo: 1, dan: 2 } },
        ];

        const expectedEntities = [{ id: 1, bar: { baz: 2, moo: 10 }, khaz: { mo: 1, dan: 2 } }];

        store.add(entities);

        const query: Query = {
            model: "foo",
            criteria: matches<Foo>({ bar: matches({ baz: inSet([2, 3]), moo: inSet([10]) }), khaz: matches({ mo: inSet([1]), dan: inSet([2]) }) }),
            expansion: {},
        };

        const result = workspace.executeQuery(query);

        console.log(result);
        expect(result).toEqual(jasmine.arrayWithExactContents(expectedEntities));
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
