import { reduceFromToValueCriterion, createFromToValueCriterion, createInValueCriterion } from "src";

describe("reduceFromToValueCriterion()", () => {
    describe("full reduction", () => {
        it("{ [1, 7] } should be completely reduced by { [0, 8] }", () => {
            // arrange
            const a = createFromToValueCriterion([1, 7]);
            const b = createFromToValueCriterion([0, 8]);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toBeNull();
        });

        it("{ [1, 7] } should be completely reduced by { (0, 8) }", () => {
            // arrange
            const a = createFromToValueCriterion([1, 7]);
            const b = createFromToValueCriterion([0, 8], false);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toBeNull();
        });

        it("{ [1, 7] } should be completely reduced by { [0, ...] }", () => {
            // arrange
            const a = createFromToValueCriterion([1, 7]);
            const b = createFromToValueCriterion([0, void 0]);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toBeNull();
        });

        it("[4, ...] should be completely reduced by [3, ...]", () => {
            // arrange
            const a = createFromToValueCriterion([4, void 0]);
            const b = createFromToValueCriterion([3, void 0]);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(null);
        });

        it("[..., 4] should be completely reduced by [..., 5]", () => {
            // arrange
            const a = createFromToValueCriterion([void 0, 4]);
            const b = createFromToValueCriterion([void 0, 5]);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(null);
        });

        it("{ [1, 7] } should be completely reduced by { [..., 9] }", () => {
            // arrange
            const a = createFromToValueCriterion([1, 7]);
            const b = createFromToValueCriterion([void 0, 9]);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toBeNull();
        });
    });

    describe("partial reduction", () => {
        it("[1, 7] reduced by [3, 10] should be [1, 3)", () => {
            // arrange
            const a = createFromToValueCriterion([1, 7]);
            const b = createFromToValueCriterion([3, 10]);
            const expected = createFromToValueCriterion([1, 3], [true, false]);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("[1, 7] reduced by [-3, 5] should be (5, 7]", () => {
            // arrange
            const a = createFromToValueCriterion([1, 7]);
            const b = createFromToValueCriterion([-3, 5]);
            const expected = createFromToValueCriterion([5, 7], [false, true]);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("[1, 7] reduced by (3, 8] should be [1, 3]", () => {
            // arrange
            const a = createFromToValueCriterion([1, 7]);
            const b = createFromToValueCriterion([3, 8], [false, true]);
            const expected = createFromToValueCriterion([1, 3]);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("[3, ...] reduced by [1, 8] should be (8, ...]", () => {
            // arrange
            const a = createFromToValueCriterion([3, void 0]);
            const b = createFromToValueCriterion([1, 8]);
            const expected = createFromToValueCriterion([8, void 0], false);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("[3, ...] reduced by [1, 8) should be [8, ...]", () => {
            // arrange
            const a = createFromToValueCriterion([3, void 0]);
            const b = createFromToValueCriterion([1, 8], [true, false]);
            const expected = createFromToValueCriterion([8, void 0]);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("[..., 3] reduced by [1, 8] should be [..., 1)", () => {
            // arrange
            const a = createFromToValueCriterion([void 0, 3]);
            const b = createFromToValueCriterion([1, 8]);
            const expected = createFromToValueCriterion([void 0, 1], false);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("[..., 3] reduced by (1, 8] should be [..., 1)", () => {
            // arrange
            const a = createFromToValueCriterion([void 0, 3]);
            const b = createFromToValueCriterion([1, 8], [false, true]);
            const expected = createFromToValueCriterion([void 0, 1]);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("[1, 7] reduced by [3, ...] should be [1, 3)", () => {
            // arrange
            const a = createFromToValueCriterion([1, 7]);
            const b = createFromToValueCriterion([3, void 0]);
            const expected = createFromToValueCriterion([1, 3], [true, false]);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("[1, 7] reduced by [..., 3) should be [3, 7]", () => {
            // arrange
            const a = createFromToValueCriterion([1, 7]);
            const b = createFromToValueCriterion([void 0, 3], false);
            const expected = createFromToValueCriterion([3, 7]);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ [1, 2] } reduced by { in [2] } should be { [1, 2) }", () => {
            // arrange
            const a = createFromToValueCriterion([1, 2]);
            const b = createInValueCriterion([2]);
            const expected = createFromToValueCriterion([1, 2], [true, false]);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ [1, 2] } reduced by { in [1] } should be { (1, 2] }", () => {
            // arrange
            const a = createFromToValueCriterion([1, 2]);
            const b = createInValueCriterion([1]);
            const expected = createFromToValueCriterion([1, 2], [false, true]);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("[1, 2] reduced by { in [1, 2] } should be (1, 2)", () => {
            // arrange
            const a = createFromToValueCriterion([1, 2]);
            const b = createInValueCriterion([1, 2]);
            const expected = createFromToValueCriterion([1, 2], false);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("[..., 2] reduced by { in [1, 2] } should be [..., 2)", () => {
            // arrange
            const a = createFromToValueCriterion([void 0, 2]);
            const b = createInValueCriterion([1, 2]);
            const expected = createFromToValueCriterion([void 0, 2], false);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("[1, ...] reduced by { in [1, 2] } should be (1, ...]", () => {
            // arrange
            const a = createFromToValueCriterion([1, void 0]);
            const b = createInValueCriterion([1, 2]);
            const expected = createFromToValueCriterion([1, void 0], false);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });
    });

    describe("no reduction", () => {
        it("{ [1, 2] } should not be reduced by { in [3] }", () => {
            // arrange
            const a = createFromToValueCriterion([1, 2]);
            const b = createInValueCriterion([3]);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toBe(a);
        });

        it("{ [1, 7] } should not be reduced by { (1, 7) }", () => {
            // arrange
            const a = createFromToValueCriterion([1, 7]);
            const b = createFromToValueCriterion([1, 7], false);

            // act
            const reduced = reduceFromToValueCriterion(a, b);

            // assert
            expect(reduced).toBe(a);
        });
    });
});
