import { ObjectCache } from "./object-cache";

describe("object-cache", () => {
    it("should return an object for its primary key", () => {
        let foo = { id: 7, name: "bar" };
        let cache = new ObjectCache<number, any>({ getKey: v => v.id });

        cache.add(foo);

        expect(cache.get(7)).toBe(foo);
    });

    it("should return a map of objects for their primary keys", () => {
        let khaz = { id: 64, name: "khaz" };
        let mo = { id: 128, name: "mo" };
        let dan = { id: 256, name: "dan" };
        let cache = new ObjectCache<number, any>({ getKey: v => v.id });

        cache.addMany([khaz, mo, dan]);
        let actual = cache.getMany([khaz.id, mo.id, dan.id]);

        expect(actual.get(khaz.id)).toBe(khaz);
        expect(actual.get(mo.id)).toBe(mo);
        expect(actual.get(dan.id)).toBe(dan);
    });

    it("should not throw if it didn't find via primay key(s)", () => {
        let cache = new ObjectCache<number, any>({ getKey: v => v.id });

        expect(() => cache.get(1)).not.toThrow();
        expect(() => cache.getMany([1, 64, 1337])).not.toThrow();
    });

    it("should return a map of objects for 1 index", () => {
        let foo = { id: 7, name: "foo", tag: "baz" };
        let bar = { id: 13, name: "bar", tag: "baz" };
        let notBaz = { id: 64, name: "notBaz", tag: "not-baz" };

        let cache = new ObjectCache<number, any>({
            getKey: v => v.id,
            indexes: { tag: v => v.tag }
        });

        cache.addMany([foo, bar, notBaz]);
        let result = cache.byIndex("tag", "baz");

        expect(result.size).toBe(2);
        expect(Array.from(result.values())).toEqual([foo, bar]);
    });

    it("should return a map of objects for n indexes", () => {
        let foo = { id: 7, name: "foo", tag: "baz", scope: "global" };
        let bar = { id: 13, name: "bar", tag: "baz", scope: "global" };
        let notBaz = { id: 64, name: "notBaz", tag: "not-baz", scope: "global" };
        let bazButNotGlobal = { id: 128, name: "notBaz", tag: "baz", scope: "local" };

        let cache = new ObjectCache<number, any>({
            getKey: v => v.id,
            indexes: { tag: v => v.tag, scope: v => v.scope }
        });

        cache.addMany([foo, bar, notBaz, bazButNotGlobal]);

        let result = cache.byIndexes({
            tag: "baz",
            scope: "global"
        });

        expect(result.size).toBe(2);
        expect(Array.from(result.values())).toEqual([foo, bar]);
    });

    it("should throw when trying to access by non-existing index", () => {
        let cache = new ObjectCache<number, any>({
            getKey: v => v.id,
            indexes: { foo: x => x }
        });

        expect(() => cache.byIndex("i-dont-exist", "me-too")).toThrow();
        expect(() => cache.byIndexes({ null: 0, andVoid: void 0 })).toThrow();
        expect(() => cache.removeByIndex("i-dont-exist", "me-too")).toThrow();
    });

    it("should be empty after clearing", () => {
        let foo = { id: 7, name: "foo", tag: "baz" };

        let cache = new ObjectCache<number, any>({
            getKey: v => v.id,
            indexes: { tag: v => v.tag }
        });

        cache.add(foo);
        cache.clear();

        expect(cache.get(foo.id)).not.toBe(foo);
        expect(cache.byIndex("tag", foo.tag).size).toBe(0);
        expect(cache.byIndex("tag", foo.tag).values().next().value).not.toBe(foo);
        expect(cache.size).toBe(0);
    });

    it("should throw if trying to add item with a null/undefined primary key", () => {
        let cache = new ObjectCache<number, any>({ getKey: v => v.id });

        expect(() => cache.add({})).toThrow();
        expect(() => cache.add({ id: null })).toThrow();
        expect(() => cache.add({ id: undefined })).toThrow();
    });

    it("should have the expected size", () => {
        let cache = new ObjectCache<number, any>({ getKey: v => v.id });

        expect(cache.size).toBe(0);
        cache.add({ id: 1 });
        expect(cache.size).toBe(1);
        cache.add({ id: 2 });
        expect(cache.size).toBe(2);
    });
});
