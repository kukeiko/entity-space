import { inSet, matches, Query } from "../public";
import { ObjectStore } from "./object-store";
import { Workspace } from "./workspace";

describe("playground: workspace", () => {
    it("should do things", () => {
        interface Foo {
            id: number;
            bar: number;
        }

        const workspace = new Workspace();
        const store = new ObjectStore("foo", ["id"], { bar: { paths: ["bar"] } });
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
        const store = new ObjectStore("foo", ["id"], { barAndBaz: { paths: ["bar", "baz"] } });
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

    xit("indexeddb interface looky looky stuff", () => {
        const db: IDBDatabase = {} as any;
        // db.transaction().
        const myStore = db.createObjectStore("foo");
        const myIndex = myStore.createIndex("", "", { multiEntry: true });
        myIndex.get(["foo", 1, [[3]]]);
        myStore.openCursor();
        myStore.delete;

        // myStore.index("foo").k
        // myStore.indexNames
    });
});
