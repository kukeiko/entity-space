import { isValue, matches } from "@entity-space/criteria";
import { cloneJson } from "@entity-space/utils";
import { ComplexKeyMap } from "../lib/entity/data-structures/complex-key-map";

interface Vector {
    x: number;
    y: number;
    z: number;
}

interface Block {
    pos: Vector;
}

describe("complex-key-map", () => {
    it("should do its thing", () => {
        // arrange
        const map = new ComplexKeyMap<Block, string>(["pos.x", "pos.y", "pos.z"]);
        const key: Block = { pos: { x: 1, y: 0, z: -1 } };
        const value = "near-origin";

        // act
        map.set(key, value);
        const actual = map.get(cloneJson(key));

        // assert
        expect(actual).toEqual(value);
    });

    it("should not return", () => {
        // arrange
        const map = new ComplexKeyMap<Block, string>(["pos.x", "pos.y", "pos.z"]);
        const keyA: Block = { pos: { x: 1, y: 0, z: -1 } };
        const keyB: Block = { pos: { x: 2, y: 0, z: -1 } };
        const value = "near-origin";

        // act
        map.set(keyA, value);
        const actual = map.get(keyB);

        // assert
        expect(actual).toBeUndefined();
    });

    it("should return by criterion", () => {
        // arrange
        const map = new ComplexKeyMap<Block, string>(["pos.x", "pos.y", "pos.z"]);
        const key: Block = { pos: { x: 1, y: 0, z: -1 } };
        const value = "near-origin";
        const criterion = matches<Block>({
            pos: matches<Block["pos"]>({ x: isValue(1), y: isValue(0), z: isValue(-1) }),
        });

        // act
        map.set(key, value);
        const actual = map.getByCriterion(criterion);

        expect(actual).not.toBe(false);

        if (actual !== false) {
            expect(actual.values).toEqual([value]);
            expect(actual.remapped.getOpen()).toEqual([]);
        }
    });
});