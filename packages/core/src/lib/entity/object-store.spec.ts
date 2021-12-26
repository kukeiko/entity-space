import { Schema, SchemaIndexArgument } from "./metadata/schema";
import { ObjectStore } from "./object-store";

function createSchema(name: string, key: string | string[], indexes?: SchemaIndexArgument[]): Schema {
    return new Schema({ name, key, properties: {}, indexes });
}

describe("object-store", () => {
    it("returns an object by key", () => {
        // arrange
        const store = new ObjectStore(createSchema("foo", "bar"));
        const expected = { bar: 3 };

        // act
        store.add([expected]);

        // assert
        expect(store.getByKey(3)).toEqual(expected);
        expect(store.getByKey(2)).toEqual(void 0);
    });

    it("returns an object by composite key", () => {
        // arrange
        const store = new ObjectStore(createSchema("foo", ["bar", "baz"]));
        const expected = { bar: 3, baz: 4 };

        // act
        store.add([expected]);

        // assert
        expect(store.getByKey([3, 4])).toEqual(expected);
        expect(store.getByKey([3, 5])).toEqual(void 0);
    });

    it("returns an object by composite nested key", () => {
        // arrange
        const store = new ObjectStore(createSchema("foo", ["bar", "baz", "khaz.modan"]));
        const expected = { bar: 3, baz: 4, khaz: { modan: 7 } };

        // act
        store.add([expected]);

        // assert
        expect(store.getByKey([3, 4, 7])).toEqual(expected);
        expect(store.getByKey([3, 4, 8])).toEqual(void 0);
    });

    it("returns an array of objects by keys", () => {
        // arrange
        const khaz = { id: 64, name: "khaz" };
        const mo = { id: 128, name: "mo" };
        const dan = { id: 256, name: "dan" };
        const store = new ObjectStore(createSchema("foo", "id"));

        // act
        store.add([khaz, mo, dan]);
        const actual = store.getByKeys([khaz.id, mo.id, dan.id]);

        // assert
        // expect(actual).toEqual(jasmine.arrayWithExactContents([khaz, mo, dan]));
        expect(actual.length).toEqual([khaz, mo, dan].length)
        expect(actual).toEqual(expect.arrayContaining([khaz, mo, dan]));
    });

    xit("returns an array of objects by an array of nested composite keys", () => {
        // [todo] implement
    });

    it("doesn't throw if it didn't find anything or just partial results", () => {
        // arrange
        const store = new ObjectStore(createSchema("foo", "bar"));

        // assert
        expect(() => store.getByKey(64)).not.toThrow();
        expect(() => store.getByKeys([64, 128])).not.toThrow();

        store.add([{ bar: 64 }]);
        expect(() => store.getByKeys([64, 128])).not.toThrow();
    });

    it("returns an array of objects for 1 index", () => {
        // arrange
        const baz = [
            { id: 7, tag: "baz" },
            { id: 13, tag: "baz" },
        ];
        const notBaz = { id: 64, tag: "not-baz" };

        const store = new ObjectStore(createSchema("foo", "id", ["tag"]));

        // act
        store.add([...baz, notBaz]);
        const result = store.getByIndex("tag", ["baz"]);

        // assert
        expect(result).toEqual(baz);
    });

    it("returns an array of objects for 1 composite index", () => {
        // arrange
        const bazAndSweet = [
            { id: 7, tag: "baz", flavor: "sweet" },
            { id: 13, tag: "baz", flavor: "sweet" },
        ];
        const bazButNotSweet = { id: 64, tag: "bag", flavor: "salty" };

        const store = new ObjectStore(
            createSchema("foo", "id", [
                {
                    name: "tagAndFlavor",
                    path: ["tag", "flavor"],
                },
            ])
        );

        // act
        store.add([...bazAndSweet, bazButNotSweet]);
        const result = store.getByIndex("tagAndFlavor", [["baz", "sweet"]]);

        // assert
        expect(result).toEqual(bazAndSweet);
    });

    // [todo] in the old object store, composite index access worked by intersecting multiple single indexes.
    // since we now support composite indexes, we probably don't need this feature.
    // i'll probably figure that out once i work on the "execute query against store" feature
    //
    // it("returns a map of objects for n indexes", () => {
    //     let foo = { id: 7, name: "foo", tag: "baz", scope: "global" };
    //     let bar = { id: 13, name: "bar", tag: "baz", scope: "global" };
    //     let notBaz = { id: 64, name: "notBaz", tag: "not-baz", scope: "global" };
    //     let bazButNotGlobal = { id: 128, name: "notBaz", tag: "baz", scope: "local" };

    //     let cache = new ObjectStore<number, any>({
    //         getKey: v => v.id,
    //         indexes: { tag: v => v.tag, scope: v => v.scope, name: v => v.name },
    //     });

    //     cache.add([foo, bar, notBaz, bazButNotGlobal]);

    //     {
    //         let result = cache.byIndexes({
    //             tag: "baz",
    //             scope: "global",
    //         });

    //         // expect(result.size).toBe(2);
    //         expect(Array.from(result.values())).toEqual([foo, bar]);
    //     }

    //     {
    //         let result = cache.byIndexes({
    //             name: "notBaz",
    //         });

    //         // expect(result.size).toBe(2);
    //         expect(Array.from(result.values())).toEqual([notBaz, bazButNotGlobal]);
    //     }
    // });

    it("throws when trying to access by non-existing index", () => {
        // arrange
        const store = new ObjectStore(createSchema("foo", "id"));

        // assert
        expect(() => store.getByIndex("i-dont-exist", ["me-too"])).toThrow();

        // [todo] implement
        // expect(() => store.removeByIndex("i-dont-exist", "me-too")).toThrow();
    });

    it("throws if trying to add item with a null/undefined primary key", () => {
        // arrange
        const cache = new ObjectStore(createSchema("foo", "id"));

        // assert
        expect(() => cache.add([{}])).toThrow();
        expect(() => cache.add([{ id: null }])).toThrow();
        expect(() => cache.add([{ id: undefined }])).toThrow();
    });

    // [todo] reimplement. indexeddb has a "count()" method which takes a query, so we probably wanna offer the same.
    // it("should have a size indicating number of cached objects", () => {
    //     let cache = new ObjectStore<number, any>({ getKey: v => v.id });

    //     expect(cache.size).toBe(0);
    //     cache.add([{ id: 1 }]);
    //     expect(cache.size).toBe(1);
    //     cache.add([{ id: 2 }]);
    //     expect(cache.size).toBe(2);
    //     cache.remove([{ id: 2 }]);
    //     expect(cache.size).toBe(1);
    //     cache.remove([{ id: 1 }]);
    //     expect(cache.size).toBe(0);
    // });

    it("should be empty after clearing", () => {
        // arrange
        const foo = { id: 7, name: "foo", tag: "baz" };
        const store = new ObjectStore(createSchema("foo", "id", ["tag"]));

        // act
        store.add([foo]);
        store.clear();

        // assert
        expect(store.getByKey(foo.id)).toEqual(void 0);
        expect(store.getByIndex("tag", [foo.tag]).length).toBe(0);
    });
});
