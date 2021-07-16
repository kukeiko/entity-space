import { isEven, AndCombinedValueCriteria, inRange, inSet } from "../../../src";

describe("reduce: binary", () => {
    describe("full reduction", () => {
        it("is-even should be fully reduced by itself", () => {
            // arrange
            const a = isEven(true);
            const b = isEven(true);

            // act
            const reduced = b.reduce(a);

            // assert
            expect(reduced).toBe(true);
        });
    });
});
