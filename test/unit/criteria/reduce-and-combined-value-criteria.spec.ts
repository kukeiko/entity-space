import { AndCombinedValueCriteria, inRange, inSet, isEven } from "../../../src";

fdescribe("reduce: and-combined-value-criteria", () => {
    describe("full reduction", () => {
        it("([2, 3] & is-even) should be fully reduced by [1, 7]", () => {
            // arrange
            const a = new AndCombinedValueCriteria([inRange(2, 3), isEven(true)]);
            const b = inRange(1, 7);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBe(true);
        });
    });

    describe("partial reduction", () => {
        it("([3, 10] & is-even) reduced by [1, 7] should be ((7, 10] & {10})", () => {
            // arrange
            const a = new AndCombinedValueCriteria([inRange(3, 10), isEven(true)]);
            const b = inRange(1, 7);
            const expected = new AndCombinedValueCriteria([inRange(7, 10, [false, true]), isEven(true)]);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("[1, 7] reduced by ([3, 5] & is-even) should be (([1, 3) | (5, 7]) | ([3, 5] & is-odd))", () => {
            //
        });

        it("[4, 8] reduced by ([1, 7] & [5, 12]) should be ((7, 8] | [4, 5))", () => {
            //
        });

        it("starts-with(foo) reduced by (starts-with(foo) & contains(bar) & ends-with(baz)) should be (starts-with(foo) & !(contains(bar) & ends-with(baz))) ", () => {
            //
        });
    });

    describe("no reduction", () => {
        it("({5} & [8, 10]) should not be reduced by [1, 7]", () => {
            // arrange
            const a = new AndCombinedValueCriteria([inSet([5]), inRange(8, 10)]);
            const b = inRange(1, 7);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBe(false);
        });
    });
});
