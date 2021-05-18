import { reduceNotInValueCriterion, createNotInValueCriterion, createInValueCriterion, createFromToValueCriterion } from "src";

describe("reduce: not-in", () => {
    describe("full reduction", () => {
        it("!{1, 2} should be completely reduced by itself", () => {
            // arrange
            const a = createNotInValueCriterion([1, 2]);
            const b = createNotInValueCriterion([1, 2]);

            // act
            const reduced = reduceNotInValueCriterion(a, b);

            // assert
            expect(reduced).toEqual([]);
        });

        it("!{1, 2} should be completely reduced by !{1}", () => {
            // arrange
            const a = createNotInValueCriterion([1, 2]);
            const b = createNotInValueCriterion([1]);

            // act
            const reduced = reduceNotInValueCriterion(a, b);

            // assert
            expect(reduced).toEqual([]);
        });
    });

    describe("partial reduction", () => {
        it("!{1, 2} reduced by !{1, 2, 3} should be {3}", () => {
            // arrange
            const a = createNotInValueCriterion([1, 2]);
            const b = createNotInValueCriterion([1, 2, 3]);
            const expected = [createInValueCriterion([3])];

            // act
            const reduced = reduceNotInValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("!{1} reduced by !{2, 3} should be {2, 3}", () => {
            // arrange
            const a = createNotInValueCriterion([1]);
            const b = createNotInValueCriterion([2, 3]);
            const expected = [createInValueCriterion([2, 3])];

            // act
            const reduced = reduceNotInValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("!{1, 2} reduced by {2, 3} should be !{1, 2, 3}", () => {
            // arrange
            const a = createNotInValueCriterion([1, 2]);
            const b = createInValueCriterion([2, 3]);
            const expected = [createNotInValueCriterion([1, 2, 3])];

            // act
            const reduced = reduceNotInValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });
    });

    describe("no reduction", () => {
        it("!{1, 2, 3} should not be reduced by [4, 7]", () => {
            // arrange
            const a = createNotInValueCriterion([1, 2, 3]);
            const b = createFromToValueCriterion([4, 7]);

            // act
            const reduced = reduceNotInValueCriterion(a, b);

            // assert
            expect(reduced).toBeFalse();
        });
    });
});
