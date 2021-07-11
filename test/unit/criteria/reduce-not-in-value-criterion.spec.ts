import { notInSet, inSet, inRange } from "../../../src";

describe("reduce: not-in", () => {
    describe("full reduction", () => {
        it("!{1, 2} should be completely reduced by itself", () => {
            // arrange
            const a = notInSet([1, 2]);
            const b = notInSet([1, 2]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual([]);
        });

        it("!{1, 2} should be completely reduced by !{1}", () => {
            // arrange
            const a = notInSet([1, 2]);
            const b = notInSet([1]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual([]);
        });
    });

    describe("partial reduction", () => {
        it("!{1, 2} reduced by !{1, 2, 3} should be {3}", () => {
            // arrange
            const a = notInSet([1, 2]);
            const b = notInSet([1, 2, 3]);
            const expected = [inSet([3])];

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("!{1} reduced by !{2, 3} should be {2, 3}", () => {
            // arrange
            const a = notInSet([1]);
            const b = notInSet([2, 3]);
            const expected = [inSet([2, 3])];

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("!{1, 2} reduced by {2, 3} should be !{1, 2, 3}", () => {
            // arrange
            const a = notInSet([1, 2]);
            const b = inSet([2, 3]);
            const expected = [notInSet([1, 2, 3])];

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(expected);
        });
    });

    describe("no reduction", () => {
        it("!{1, 2, 3} should not be reduced by [4, 7]", () => {
            // arrange
            const a = notInSet([1, 2, 3]);
            const b = inRange(4, 7);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBeFalse();
        });
    });
});
