import { isValue, matches } from "@entity-space/criteria";
import { cloneJson } from "@entity-space/utils";
import { ComplexKeyMap } from "./complex-key-map";

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
        const map = new ComplexKeyMap(["pos.x", "pos.y", "pos.z"]);
        const block = { pos: { x: 1, y: 0, z: -1 } };
        const expected = "near-origin";

        // act
        map.set(block, expected);
        const actual = map.get(cloneJson(block));

        // assert
        expect(actual).toEqual(expected);
    });

    it("should not return", () => {
        // arrange
        const map = new ComplexKeyMap(["pos.x", "pos.y", "pos.z"]);
        const blockA = { pos: { x: 1, y: 0, z: -1 } };
        const blockB = { pos: { x: 2, y: 0, z: -1 } };
        const expected = "near-origin";

        // act
        map.set(blockA, expected);
        const actual = map.get(blockB);

        // assert
        expect(actual).toBeUndefined();
    });

    it("should return by criterion", () => {
        // arrange
        const map = new ComplexKeyMap(["pos.x", "pos.y", "pos.z"]);
        const block = { pos: { x: 1, y: 0, z: -1 } };
        const expected = "near-origin";
        const criterion = matches<Block>({
            pos: matches<Block["pos"]>({ x: isValue(1), y: isValue(0), z: isValue(-1) }),
        });

        // act
        map.set(block, expected);
        const actual = map.getByCriterion(criterion);

        expect(actual).not.toBe(false);

        if (actual !== false) {
            expect(actual.values).toEqual([expected]);
            expect(actual.remapped.getOpen()).toEqual([]);
        }
    });
});
