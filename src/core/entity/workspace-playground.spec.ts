import { inSet, matches, Query } from "../public";
import { Schema } from "./metadata/schema";
import { SchemaIndex } from "./metadata/schema-index";
import { SchemaJson } from "./metadata/schema-json";
import { ObjectStore } from "./object-store";
import { Workspace } from "./workspace";

describe("playground: workspace", () => {
    it("expanding", () => {
        const fooSchema = new Schema({
            name: "foo",
            key: new SchemaIndex("id", ["id", "secondaryId"]),
            properties: {
                bar: { type: "object", model: "bar", link: { from: "id", to: "fooId" } },
            },
        });

        const barSchema = new Schema({
            name: "bar",
            key: new SchemaIndex("id", ["id"]),
            indexes: [new SchemaIndex("fooId", ["fooId", "secondaryId"])],
            properties: {},
        });

        const workspace = new Workspace();
        workspace.addSchema(fooSchema);
        workspace.addSchema(barSchema);
        workspace.addStore(new ObjectStore("foo", ["id"], { id: { path: ["id", "secondaryId"] } }));
        workspace.addStore(new ObjectStore("bar", ["id"], { fooId: { path: ["fooId", "secondaryId"] } }));
        workspace.addItems("foo", [{ id: 1337, secondaryId: 128, name: "i am foo" }]);
        workspace.addItems("bar", [{ id: 64, fooId: 1337, secondaryId: 128, name: "i belong to foo" }]);

        const query: Query = { model: "foo", expansion: { bar: true }, criteria: matches({ id: inSet([1337]) }) };
        const fooItems = workspace.executeQuery(query);
        // const barItemsOfFooItems = workspace.expandResult("foo", "bar", fooItems);

        console.log("expanded foo items:", fooItems);
        // console.log("bar items:", barItemsOfFooItems);
    });

    fit("expanding #2", () => {
        const fooSchema = new Schema({
            name: "foo",
            key: new SchemaIndex("id", ["id"]),
            properties: {
                bar: {
                    type: "object",
                    model: "bar",
                },
            },
        });

        const barSchema = new Schema({
            name: "bar",
            indexes: [new SchemaIndex("bazId", ["bazId"])],
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
            key: new SchemaIndex("id", ["id"]),
            properties: {},
        });

        const workspace = new Workspace();
        workspace.addSchema(barSchema);
        workspace.addSchema(fooSchema);
        workspace.addSchema(bazSchema);
        workspace.addStore(new ObjectStore("foo", ["id"]));
        workspace.addStore(new ObjectStore("baz", ["id"], { id: { path: ["id"] } }));
        workspace.addItems("foo", [{ id: 1337, name: "i am foo", bar: { bazId: 128 } }]);
        workspace.addItems("baz", [{ id: 128, name: "i am baz" }]);

        const query: Query = { model: "foo", expansion: { bar: { baz: true } }, criteria: matches({ id: inSet([1337]) }) };
        const fooItems = workspace.executeQuery(query);
        // const barItemsOfFooItems = workspace.expandResult("foo", "bar", fooItems);

        console.log("expanded foo items:", fooItems);
        // console.log("bar items:", barItemsOfFooItems);
    });

    it("squawking around", () => {
        const schema: SchemaJson = {} as any;

        for (const key in schema.properties) {
            const property = schema.properties[key];
        }

        const workspace = new Workspace();
        const store = new ObjectStore("foo", ["id"], { bar: { path: ["bar"] } });
        workspace.addStore(store);

        const criteria = workspace.createCriteriaForIndex("foo", "bar", [1, 2, 3]);
        console.log(criteria);

        workspace.addStore(new ObjectStore("bar", ["id"], { baz: { path: ["khaz.mo", "foo", "khaz.dan"] } }));
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
        const store = new ObjectStore("foo", ["id"], { bar: { path: ["bar"] } });
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

        const workspace = new Workspace();
        const store = new ObjectStore("foo", ["id"], { barAndBaz: { path: ["bar", "baz"] } });
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

        const workspace = new Workspace();
        const store = new ObjectStore("foo", ["id"], { bar: { path: ["bar.baz"] } });
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

        const workspace = new Workspace();
        const store = new ObjectStore("foo", ["id"], { bar: { path: ["bar.baz", "bar.moo"] } });
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

    it("should execute query w/ composite dsitributed nested index", () => {
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

        const workspace = new Workspace();
        const store = new ObjectStore("foo", ["id"], { bar: { path: ["bar.baz", "bar.moo", "khaz.mo", "khaz.dan"] } });
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
