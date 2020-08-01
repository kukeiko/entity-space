import { createInValueCriterion, reduceCriterion } from "src";

describe("reduceCriterion()", () => {
    describe("full reduction", () => {
        it("{ foo in [2], bar in [3, 4, 7] } should be completely reduced by { foo in [2], bar in [3, 4, 7] }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3, 4, 7])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3, 4, 7])],
            };

            // act
            const reduced = reduceCriterion(a, b);

            // assert
            expect(reduced).toBeNull();
        });

        it("{ foo in [2], bar in [3] } should be completely reduced by { foo in [2] }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
            };

            // act
            const reduced = reduceCriterion(a, b);

            // assert
            expect(reduced).toBeNull();
        });
    });

    describe("partial reduction", () => {
        it("{ foo in [2, 3] } reduced by { foo in [3, 4] } should be { foo in [2] }", () => {
            // arrange
            const a = { foo: [createInValueCriterion([2, 3])] };
            const b = { foo: [createInValueCriterion([3, 4])] };
            const expected = { foo: [createInValueCriterion([2])] };

            // act
            const reduced = reduceCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ foo in [1, 2], bar in [3] } reduced by { foo in [2] } should be { foo in [1], bar in [3] }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([1, 2])],
                bar: [createInValueCriterion([3])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
            };

            const expected = {
                foo: [createInValueCriterion([1])],
                bar: [createInValueCriterion([3])],
            };

            // act
            const reduced = reduceCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ foo in [1, 2], bar in [3] } reduced by { foo in [2], bar in [3, 4] } should be { foo in [1], bar in [3] }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([1, 2])],
                bar: [createInValueCriterion([3])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3, 4])],
            };

            const expected = {
                foo: [createInValueCriterion([1])],
                bar: [createInValueCriterion([3])],
            };

            // act
            const reduced = reduceCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });
    });

    describe("no reduction", () => {
        it("{ foo in [3] } should not be reduced by { foo in [2] }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([3])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
            };

            // act
            const reduced = reduceCriterion(a, b);

            // assert
            expect(reduced).toBe(a);
        });

        it("{ foo in [2] } should not be reduced by { foo in [2], bar in [3] }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([2])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3])],
            };

            // act
            const reduced = reduceCriterion(a, b);

            // assert
            expect(reduced).toBe(a);
        });

        it("{ foo in [2], bar in [3] } should not be reduced by { foo in [2], bar in [4] }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([4])],
            };

            // act
            const reduced = reduceCriterion(a, b);

            // assert
            expect(reduced).toBe(a);
        });
    });
});
