import { createFromToValueCriterion, createInValueCriterion, createNotInValueCriterion, reduceInValueCriterion } from "src";

describe("reduceInValueCriterion()", () => {
    /**
     * A criteria that is a subset of another should always be completely reduced.
     */
    describe("full reduction", () => {
        it("in:(1, 2, 3) should be completely reduced by itself", () => {
            // arrange
            const a = createInValueCriterion([1, 2, 3]);
            const b = createInValueCriterion([1, 2, 3]);

            // act
            const reduced = reduceInValueCriterion(a, b);

            // assert
            expect(reduced).toBeNull();
        });

        it("in:(1, 2, 3) should be completely reduced by in:(1, 2, 3, 4)", () => {
            // arrange
            const a = createInValueCriterion([1, 2, 3]);
            const b = createInValueCriterion([1, 2, 3, 4]);

            // act
            const reduced = reduceInValueCriterion(a, b);

            // assert
            expect(reduced).toBeNull();
        });

        it("in:(1, 2, 3) should be completely reduced by not-in:(4)", () => {
            // arrange
            const a = createInValueCriterion([1, 2, 3]);
            const b = createNotInValueCriterion([4]);

            // act
            const reduced = reduceInValueCriterion(a, b);

            // assert
            expect(reduced).toBeNull();
        });
    });

    /**
     * An intersection between two criteria should always be removed.
     */
    describe("partial reduction", () => {
        it("in:(1, 2, 3) reduced by in:(1, 2, 4) should be in:(3)", () => {
            // arrange
            const a = createInValueCriterion([1, 2, 3]);
            const b = createInValueCriterion([1, 2, 4]);
            const expected = createInValueCriterion([3]);

            // act
            const reduced = reduceInValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("in:(1, 2, 3) reduced by not-in:(1) should be in:(1)", () => {
            // arrange
            const a = createInValueCriterion([1, 2, 3]);
            const b = createNotInValueCriterion([1]);
            const expected = createInValueCriterion([1]);

            // act
            const reduced = reduceInValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });
    });

    /**
     * If there is no intersection, the criteria should be left untouched.
     */
    describe("no reduction", () => {
        it("in:(1, 2, 3) should not be reduced by in:(4, 5, 6)", () => {
            // arrange
            const a = createInValueCriterion([1, 2, 3]);
            const b = createInValueCriterion([4, 5, 6]);

            // act
            const reduced = reduceInValueCriterion(a, b);

            // assert
            expect(reduced).toBe(a);
        });

        it("in:(1, 2, 3) should not be reduced by not-in:(1, 2, 3)", () => {
            // arrange
            const a = createInValueCriterion([1, 2, 3]);
            const b = createNotInValueCriterion([1, 2, 3]);

            // act
            const reduced = reduceInValueCriterion(a, b);

            // assert
            expect(reduced).toBe(a);
        });

        it("in:(1, 2, 3) should not be reduced by [1, 3]", () => {
            // arrange
            const a = createInValueCriterion([1, 2, 3]);
            const b = createFromToValueCriterion([4, 7]);

            // act
            const reduced = reduceInValueCriterion(a, b);

            // assert
            expect(reduced).toBe(a);
        });
    });
});
