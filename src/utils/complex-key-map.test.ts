import { ComplexKeyMap, toPaths } from "@entity-space/utils";
import { describe, expect, it } from "vitest";

interface Vector {
    x: number;
    y: number;
    z: number;
}

interface Block {
    pos: Vector;
}

interface Song {
    id: number;
    name: string;
    artistId: number;
    namespace: string;
}

interface Artist {
    id: number;
    name: string;
    namespace: string;
}

describe(ComplexKeyMap.name, () => {
    it("should store and retrieve a value by key", () => {
        // arrange
        const map = new ComplexKeyMap<Block, string>(toPaths(["pos.x", "pos.y", "pos.z"]));
        const key: Block = { pos: { x: 1, y: 0, z: -1 } };
        const expected = "air";

        // act
        map.set(key, expected);
        const actual = map.get(key);

        // assert
        expect(actual).toEqual(expected);
    });

    it("should also work with only one path element", () => {
        // arrange
        const map = new ComplexKeyMap<Block, string>(toPaths(["pos.x"]));
        const key: Block = { pos: { x: 1, y: 0, z: -1 } };
        const expected = "water";

        // act
        map.set(key, expected);
        const actual = map.get(key);

        // assert
        expect(actual).toEqual(expected);
    });

    it("should return undefined if not found", () => {
        // arrange
        const map = new ComplexKeyMap<Block, string>(toPaths(["pos.x", "pos.y", "pos.z"]));
        const keyA: Block = { pos: { x: 1, y: 0, z: -1 } };
        const keyB: Block = { pos: { x: 2, y: 0, z: -1 } };
        const expected = "diamonds";

        // act
        map.set(keyA, expected);
        const actual = map.get(keyB);

        // assert
        expect(actual).toBeUndefined();
    });

    it("should overwrite values given the same key", () => {
        // arrange
        const map = new ComplexKeyMap<Block, string>(toPaths(["pos.x", "pos.y", "pos.z"]));
        const key: Block = { pos: { x: 1, y: 0, z: -1 } };
        const firstValue = "grass";
        const nextValue = "dirt";

        // act
        map.set(key, firstValue);
        map.set(key, nextValue);
        const actual = map.get(key);

        // assert
        expect(actual).toEqual(nextValue);
    });

    it("should allow to use different paths", () => {
        // arrange
        const map = new ComplexKeyMap<Song, Song>(toPaths(["namespace", "artistId"]));
        const song: Song = { id: 1, artistId: 2, name: "foo", namespace: "main" };
        const artist: Artist = { id: 2, name: "bar", namespace: "main" };

        // act
        map.set(song, song);
        const actual = map.get(artist, toPaths(["namespace", "id"]));

        // assert
        expect(actual).toEqual(song);
    });

    it("should allow to clear all values", () => {
        // arrange
        const map = new ComplexKeyMap<Song, Song>(toPaths(["namespace", "artistId"]));
        const song: Song = { id: 1, artistId: 2, name: "foo", namespace: "main" };

        // act
        map.set(song, song);
        map.clear();

        // assert
        expect(map.getAll()).toEqual([]);
    });

    it("should throw if paths are invalid", () => {
        // arrange
        const createWithEmptyArray = () => new ComplexKeyMap(toPaths([]));
        const createWithEmptyPath = () => new ComplexKeyMap(toPaths([""]));
        const createWithEmptyAndNonEmptyPath = () => new ComplexKeyMap(toPaths(["foo", "", "bar"]));
        const createWithPathContainedInAnother = () => new ComplexKeyMap(toPaths(["foo.bar", "foo"]));

        // act & assert
        expect(createWithEmptyArray).toThrow();
        expect(createWithEmptyPath).toThrow();
        expect(createWithEmptyAndNonEmptyPath).toThrow();
        expect(createWithPathContainedInAnother).toThrow();
    });

    it("should throw if custom paths in get() are invalid", () => {
        // arrange
        const map = new ComplexKeyMap(toPaths(["a", "b", "c"]));
        const getWithEmptyArray = () => map.get({ d: 1, e: 1, f: 1 }, toPaths([]));
        const getWithEmptyPath = () => map.get({ d: 1, e: 1, f: 1 }, toPaths(["d", "", "f"]));
        const getWithDifferentSize = () => map.get({ d: 1, e: 1, f: 1 }, toPaths(["d", "e"]));
        const getWithPathContainedInAnother = () => map.get({ d: 1, e: 1, f: 1 }, toPaths(["foo", "foo.bar"]));

        // act & assert
        expect(getWithEmptyArray).toThrow();
        expect(getWithEmptyPath).toThrow();
        expect(getWithDifferentSize).toThrow();
        expect(getWithPathContainedInAnother).toThrow();
    });

    it("getAll() should return all stored values", () => {
        // arrange
        const map = new ComplexKeyMap<Block, Block>(toPaths(["pos.x", "pos.y", "pos.z"]));
        const entities: Block[] = [
            { pos: { x: 1, y: 0, z: -1 } },
            { pos: { x: 2, y: 1, z: -2 } },
            { pos: { x: 3, y: 2, z: -3 } },
        ];

        // act
        entities.forEach(entity => map.set(entity, entity));
        const actual = map.getAll();

        // assert
        expect(actual).toEqual(entities);
    });

    it("getMany() should return values", () => {
        // arrange
        const map = new ComplexKeyMap<Block, Block>(toPaths(["pos.x", "pos.y", "pos.z"]));
        const entities: Block[] = [
            { pos: { x: 1, y: 0, z: -1 } },
            { pos: { x: 2, y: 1, z: -2 } },
            { pos: { x: 3, y: 2, z: -3 } },
        ];
        const notStored: Block = { pos: { x: 100, y: 0, z: 0 } };
        const expected: Block[] = [entities[0], entities[2]];

        // act
        entities.forEach(entity => map.set(entity, entity));
        const actual = map.getMany([...expected, notStored]);

        // assert
        expect(actual).toEqual(expected);
    });

    describe("set()", () => {
        it("should provide update callback", () => {
            // arrange
            const map = new ComplexKeyMap<Block, string>(toPaths(["pos.x", "pos.y", "pos.z"]));
            const key: Block = { pos: { x: 1, y: 0, z: -1 } };
            const value = "air";
            const expected = "stone-air";

            // act
            map.set(key, value);
            map.set(key, "stone", previous => (previous === "air" ? "stone-air" : "stone"));
            const actual = map.get(key);

            // assert
            expect(actual).toEqual(expected);
        });

        it("should not set value if return value of update callback is equal to given value", () => {
            // arrange
            const map = new ComplexKeyMap<Artist>(toPaths(["namespace", "id"]));
            const firstValue: Artist = { id: 1, namespace: "main", name: "foo" };
            const nextValue: Artist = { id: 1, namespace: "main", name: "bar" };

            // act
            map.set(firstValue, firstValue);
            map.set(firstValue, nextValue, previous => {
                previous.name = nextValue.name;
                return nextValue;
            });

            const actual = map.get(firstValue);

            // assert
            expect(actual).toEqual(nextValue);
            expect(actual).toBe(firstValue);
        });
    });

    describe("delete()", () => {
        it("should remove entities", () => {
            // arrange
            const map = new ComplexKeyMap<Vector>(toPaths(["x", "y", "z"]));
            const vectors: Vector[] = [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 2, y: 0, z: 0 },
            ];

            const expectedGetAll = [vectors[0], vectors[2]];

            // act
            map.setMany(vectors, vectors);
            map.delete(vectors[1]);

            // assert
            expect(map.get(vectors[1])).toBeUndefined();
            expect(map.getAll()).toEqual(expectedGetAll);
        });

        it("should not throw if entity to delete doesn't exist", () => {
            // arrange
            const map = new ComplexKeyMap<Vector>(toPaths(["x", "y", "z"]));
            const vectors: Vector[] = [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 2, y: 0, z: 0 },
            ];

            // act
            map.setMany(vectors, vectors);
            const deleteEntity = () => map.delete({ x: 10, y: 20, z: 30 });

            // assert
            expect(deleteEntity).not.toThrow();
        });
    });
});
