import { EntityCriteriaTools } from "../lib/criteria/entity-criteria-tools";
import { ComplexKeyMap } from "../lib/entity/data-structures/complex-key-map";

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

describe("ComplexKeyMap", () => {
    const { where, equals } = new EntityCriteriaTools();

    it("should store and retrieve one entity", () => {
        // arrange
        const map = new ComplexKeyMap<Block, string>(["pos.x", "pos.y", "pos.z"]);
        const key: Block = { pos: { x: 1, y: 0, z: -1 } };
        const value = "air";

        // act
        map.set(key, value);
        const actual = map.get(key);

        // assert
        expect(actual).toEqual(value);
    });

    it("should also work with 1x path element", () => {
        // arrange
        const map = new ComplexKeyMap<Block, string>(["pos.x"]);
        const key: Block = { pos: { x: 1, y: 0, z: -1 } };
        const value = "water";

        // act
        map.set(key, value);
        const actual = map.get(key);

        // assert
        expect(actual).toEqual(value);
    });

    it("should return undefined if not found", () => {
        // arrange
        const map = new ComplexKeyMap<Block, string>(["pos.x", "pos.y", "pos.z"]);
        const keyA: Block = { pos: { x: 1, y: 0, z: -1 } };
        const keyB: Block = { pos: { x: 2, y: 0, z: -1 } };
        const value = "diamonds";

        // act
        map.set(keyA, value);
        const actual = map.get(keyB);

        // assert
        expect(actual).toBeUndefined();
    });

    it("should return entity by criterion", () => {
        // arrange
        const map = new ComplexKeyMap<Block, string>(["pos.x", "pos.y", "pos.z"]);
        const key: Block = { pos: { x: 1, y: 0, z: -1 } };
        const value = "iron";
        const criterion = where<Block>({
            pos: where<Block["pos"]>({ x: equals(1), y: equals(0), z: equals(-1) }),
        });

        // act
        map.set(key, value);
        const actual = map.getByCriterion(criterion);

        expect(actual).not.toBe(false);

        if (actual !== false) {
            expect(actual.values).toEqual([value]);
            expect(actual.reshaped.getOpen()).toEqual([]);
        }
    });

    it("should overwrite entity", () => {
        // arrange
        const map = new ComplexKeyMap<Block, string>(["pos.x", "pos.y", "pos.z"]);
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
        const map = new ComplexKeyMap<Song, Song>(["namespace", "artistId"]);
        const song: Song = { id: 1, artistId: 2, name: "foo", namespace: "main" };
        const artist: Artist = { id: 2, name: "bar", namespace: "main" };

        // act
        map.set(song, song);
        const actual = map.get(artist, ["namespace", "id"]);

        // assert
        expect(actual).toEqual(song);
    });

    it("should throw if paths is invalid", () => {
        // arrange
        const createWithEmptyArray = () => new ComplexKeyMap([]);
        const createWithEmptyPath = () => new ComplexKeyMap([""]);
        const createWithEmptyAndNonEmptyPath = () => new ComplexKeyMap(["foo", "", "bar"]);

        // act & assert
        expect(createWithEmptyArray).toThrow();
        expect(createWithEmptyPath).toThrow();
        expect(createWithEmptyAndNonEmptyPath).toThrow();
    });

    it("should throw if custom paths in get() is invalid", () => {
        // arrange
        const map = new ComplexKeyMap(["a", "b", "c"]);
        const getWithEmptyElements = () => map.get({ d: 1, e: 1, f: 1 }, ["d", "", "f"]);
        const getWithDifferentSize = () => map.get({ d: 1, e: 1, f: 1 }, ["d", "e"]);

        // act & assert
        expect(getWithEmptyElements).toThrow();
        expect(getWithDifferentSize).toThrow();
    });

    it("getAll() should return all stored entites", () => {
        // arrange
        const map = new ComplexKeyMap<Block, Block>(["pos.x", "pos.y", "pos.z"]);
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

    it("getMany() should return entites", () => {
        // arrange
        const map = new ComplexKeyMap<Block, Block>(["pos.x", "pos.y", "pos.z"]);
        const entities: Block[] = [
            { pos: { x: 1, y: 0, z: -1 } },
            { pos: { x: 2, y: 1, z: -2 } },
            { pos: { x: 3, y: 2, z: -3 } },
        ];

        const expected: Block[] = [entities[0], entities[2]];

        // act
        entities.forEach(entity => map.set(entity, entity));
        const actual = map.getMany(expected);

        // assert
        expect(actual).toEqual(expected);
    });

    describe("set()", () => {
        it("should provide update callback", () => {
            // arrange
            const map = new ComplexKeyMap<Block, string>(["pos.x", "pos.y", "pos.z"]);
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
            const map = new ComplexKeyMap<Artist>(["namespace", "id"]);
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
            const map = new ComplexKeyMap<Vector>(["x", "y", "z"]);
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
            const map = new ComplexKeyMap<Vector>(["x", "y", "z"]);
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
