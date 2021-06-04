import { InRangeCriterion, InSetCriterion, NotInSetCriterion } from "../../../src";

describe("reduce: in", () => {
    /**
     * A criteria that is a subset of another should always be completely reduced.
     */
    describe("full reduction", () => {
        it("{1, 2, 3} should be completely reduced by itself", () => {
            // arrange
            const a = new InSetCriterion(Number, [1, 2, 3]);
            const b = new InSetCriterion(Number, [1, 2, 3]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual([]);
        });

        it("{1, 2, 3} should be completely reduced by {1, 2, 3, 4}", () => {
            // arrange
            const a = new InSetCriterion(Number, [1, 2, 3]);
            const b = new InSetCriterion(Number, [1, 2, 3, 4]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual([]);
        });

        it("{1, 2, 3} should be completely reduced by !{4}", () => {
            // arrange
            const a = new InSetCriterion(Number, [1, 2, 3]);
            const b = new NotInSetCriterion(Number, [4]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual([]);
        });
    });

    /**
     * An intersection between two criteria should always be removed.
     */
    describe("partial reduction", () => {
        it("{1, 2, 3} reduced by {1, 2, 4} should be {3}", () => {
            // arrange
            const a = new InSetCriterion(Number, [1, 2, 3]);
            const b = new InSetCriterion(Number, [1, 2, 4]);
            const expected = [new InSetCriterion(Number, [3])];

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{1, 2, 3} reduced by !{1} should be {1}", () => {
            // arrange
            const a = new InSetCriterion(Number, [1, 2, 3]);
            const b = new NotInSetCriterion(Number, [1]);
            const expected = [new InSetCriterion(Number, [1])];

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(expected);
        });
    });

    /**
     * If there is no intersection, the criteria should be left untouched.
     */
    describe("no reduction", () => {
        it("{1, 2, 3} should not be reduced by {4, 5, 6}", () => {
            // arrange
            const a = new InSetCriterion(Number, [1, 2, 3]);
            const b = new InSetCriterion(Number, [4, 5, 6]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBeFalse();
        });

        it("{1, 2, 3} should not be reduced by !{1, 2, 3}", () => {
            // arrange
            const a = new InSetCriterion(Number, [1, 2, 3]);
            const b = new NotInSetCriterion(Number, [1, 2, 3]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBeFalse();
        });

        it("{1, 2, 3} should not be reduced by [1, 3]", () => {
            // arrange
            const a = new InSetCriterion(Number, [1, 2, 3]);
            const b = new InRangeCriterion(Number, [4, 7]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBeFalse();
        });
    });
});
