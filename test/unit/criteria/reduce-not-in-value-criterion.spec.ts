import { InRangeCriterion, InSetCriterion, NotInSetCriterion } from "../../../src";

describe("reduce: not-in", () => {
    describe("full reduction", () => {
        it("!{1, 2} should be completely reduced by itself", () => {
            // arrange
            const a = new NotInSetCriterion(Number, [1, 2]);
            const b = new NotInSetCriterion(Number, [1, 2]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual([]);
        });

        it("!{1, 2} should be completely reduced by !{1}", () => {
            // arrange
            const a = new NotInSetCriterion(Number, [1, 2]);
            const b = new NotInSetCriterion(Number, [1]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual([]);
        });
    });

    describe("partial reduction", () => {
        it("!{1, 2} reduced by !{1, 2, 3} should be {3}", () => {
            // arrange
            const a = new NotInSetCriterion(Number, [1, 2]);
            const b = new NotInSetCriterion(Number, [1, 2, 3]);
            const expected = [new InSetCriterion(Number, [3])];

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("!{1} reduced by !{2, 3} should be {2, 3}", () => {
            // arrange
            const a = new NotInSetCriterion(Number, [1]);
            const b = new NotInSetCriterion(Number, [2, 3]);
            const expected = [new InSetCriterion(Number, [2, 3])];

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("!{1, 2} reduced by {2, 3} should be !{1, 2, 3}", () => {
            // arrange
            const a = new NotInSetCriterion(Number, [1, 2]);
            const b = new InSetCriterion(Number, [2, 3]);
            const expected = [new NotInSetCriterion(Number, [1, 2, 3])];

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(expected);
        });
    });

    describe("no reduction", () => {
        it("!{1, 2, 3} should not be reduced by [4, 7]", () => {
            // arrange
            const a = new NotInSetCriterion(Number, [1, 2, 3]);
            const b = new InRangeCriterion(Number, [4, 7]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBeFalse();
        });
    });
});
