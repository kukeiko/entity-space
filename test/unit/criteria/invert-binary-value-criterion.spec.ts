import { isEven, AndCombinedValueCriteria, inRange, inSet } from "../../../src";

describe("invert: binary", () => {
    describe("full reduction", () => {
        it("is-even inverted should be is-odd", () => {
            // arrange
            const criterion = isEven(true);
            const expected = isEven(false);

            // act
            const inverted = criterion.invert();

            // assert
            expect(inverted).toEqual(expected);
        });
    });
});
