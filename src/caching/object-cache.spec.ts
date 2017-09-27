import { ObjectCache } from "./object-cache";

describe("object-cache", () => {
    it("returns an object for its id", () => {
        let foo = { id: 7, name: "bar" };
        let cache = new ObjectCache<number, any>({ getKey: v => v.id });

        cache.add([foo]);

        expect(cache.byKey(7)).toBe(foo);
    });

    it("returns a map of objects for their ids", () => {
        let khaz = { id: 64, name: "khaz" };
        let mo = { id: 128, name: "mo" };
        let dan = { id: 256, name: "dan" };
        let cache = new ObjectCache<number, any>({ getKey: v => v.id });

        cache.add([khaz, mo, dan]);
        let actual = cache.byKeys([khaz.id, mo.id, dan.id]);

        expect(actual.get(khaz.id)).toBe(khaz);
        expect(actual.get(mo.id)).toBe(mo);
        expect(actual.get(dan.id)).toBe(dan);
    });

    it("doesn't throw if it didn't find anything or just partial results", () => {
        let cache = new ObjectCache<number, any>({ getKey: v => v.id });
        expect(() => cache.byKey(64)).not.toThrow();
        expect(() => cache.byKeys([64, 128])).not.toThrow();

        cache.add([{ id: 64 }]);
        expect(cache.byKeys([64, 128]).size).toBe(1);
        expect(() => cache.byKeys([64, 128])).not.toThrow();
    });

    it("returns a map of objects for 1 index", () => {
        let baz = [{ id: 7, tag: "baz" }, { id: 13, tag: "baz" }];
        let notBaz = { id: 64, tag: "not-baz" };

        let cache = new ObjectCache<number, any>({
            getKey: v => v.id,
            indexes: { tag: v => v.tag }
        });

        cache.add([...baz, notBaz]);
        let result = cache.byIndex("tag", "baz");

        expect(result.size).toBe(2);
        expect(Array.from(result.values())).toEqual(baz);
    });

    it("returns a map of objects for n indexes", () => {
        let foo = { id: 7, name: "foo", tag: "baz", scope: "global" };
        let bar = { id: 13, name: "bar", tag: "baz", scope: "global" };
        let notBaz = { id: 64, name: "notBaz", tag: "not-baz", scope: "global" };
        let bazButNotGlobal = { id: 128, name: "notBaz", tag: "baz", scope: "local" };

        let cache = new ObjectCache<number, any>({
            getKey: v => v.id,
            indexes: { tag: v => v.tag, scope: v => v.scope, name: v => v.name }
        });

        cache.add([foo, bar, notBaz, bazButNotGlobal]);

        {
            let result = cache.byIndexes({
                tag: "baz",
                scope: "global"
            });

            expect(result.size).toBe(2);
            expect(Array.from(result.values())).toEqual([foo, bar]);
        }

        {
            let result = cache.byIndexes({
                name: "notBaz"
            });

            expect(result.size).toBe(2);
            expect(Array.from(result.values())).toEqual([notBaz, bazButNotGlobal]);
        }
    });

    it("throws when trying to access by non-existing index", () => {
        let cache = new ObjectCache<number, any>({
            getKey: v => v.id,
            indexes: { foo: x => x }
        });

        expect(() => cache.byIndex("i-dont-exist", "me-too")).toThrow();
        expect(() => cache.byIndexes({ null: 0, andVoid: void 0 })).toThrow();
        expect(() => cache.removeByIndex("i-dont-exist", "me-too")).toThrow();
    });

    it("throws if trying to add item with a null/undefined primary key", () => {
        let cache = new ObjectCache<number, any>({ getKey: v => v.id });

        expect(() => cache.add([{}])).toThrow();
        expect(() => cache.add([{ id: null }])).toThrow();
        expect(() => cache.add([{ id: undefined }])).toThrow();
    });

    it("should have a size indicating number of cached objects", () => {
        let cache = new ObjectCache<number, any>({ getKey: v => v.id });

        expect(cache.size).toBe(0);
        cache.add([{ id: 1 }]);
        expect(cache.size).toBe(1);
        cache.add([{ id: 2 }]);
        expect(cache.size).toBe(2);
        cache.remove([{ id: 2 }]);
        expect(cache.size).toBe(1);
        cache.remove([{ id: 1 }]);
        expect(cache.size).toBe(0);
    });

    it("should be empty after clearing", () => {
        let foo = { id: 7, name: "foo", tag: "baz" };

        let cache = new ObjectCache<number, any>({
            getKey: v => v.id,
            indexes: { tag: v => v.tag }
        });

        cache.add([foo]);
        cache.clear();

        expect(cache.byKey(foo.id)).not.toBe(foo);
        expect(cache.byIndex("tag", foo.tag).size).toBe(0);
        expect(cache.byIndex("tag", foo.tag).values().next().value).not.toBe(foo);
        expect(cache.size).toBe(0);
    });
});
