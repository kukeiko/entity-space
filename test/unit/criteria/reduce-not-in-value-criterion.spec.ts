import { reduceNotInValueCriterion, createNotInValueCriterion, createInValueCriterion, createFromToValueCriterion } from "src";

describe("reduceNotInValueCriterion()", () => {
    describe("full reduction", () => {
        it("not-in:(1, 2) should be completely reduced by not-in:(1, 2)", () => {
            // arrange
            const a = createNotInValueCriterion([1, 2]);
            const b = createNotInValueCriterion([1, 2]);

            // act
            const reduced = reduceNotInValueCriterion(a, b);

            // assert
            expect(reduced).toBeNull();
        });

        it("not-in:(1, 2) should be completely reduced by not-in:(1)", () => {
            // arrange
            const a = createNotInValueCriterion([1, 2]);
            const b = createNotInValueCriterion([1]);

            // act
            const reduced = reduceNotInValueCriterion(a, b);

            // assert
            expect(reduced).toBeNull();
        });
    });

    describe("partial reduction", () => {
        it("not-in:(1, 2) reduced by not-in:(1, 2, 3) should be in:(3)", () => {
            // arrange
            const a = createNotInValueCriterion([1, 2]);
            const b = createNotInValueCriterion([1, 2, 3]);
            const expected = createInValueCriterion([3]);

            // act
            const reduced = reduceNotInValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("not-in:(1) reduced by not-in:(2, 3) should be in:(2, 3)", () => {
            // arrange
            const a = createNotInValueCriterion([1]);
            const b = createNotInValueCriterion([2, 3]);
            const expected = createInValueCriterion([2, 3]);

            // act
            const reduced = reduceNotInValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("not-in:(1, 2) reduced by in:(2, 3) should be not-in:(1, 2, 3)", () => {
            // arrange
            const a = createNotInValueCriterion([1, 2]);
            const b = createInValueCriterion([2, 3]);
            const expected = createNotInValueCriterion([1, 2, 3]);

            // act
            const reduced = reduceNotInValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });
    });

    describe("no reduction", () => {
        it("not-in:(1, 2, 3) should not be reduced by [4, 7]", () => {
            // arrange
            const a = createNotInValueCriterion([1, 2, 3]);
            const b = createFromToValueCriterion([4, 7]);

            // act
            const reduced = reduceNotInValueCriterion(a, b);

            // assert
            expect(reduced).toBe(a);
        });
    });
});
