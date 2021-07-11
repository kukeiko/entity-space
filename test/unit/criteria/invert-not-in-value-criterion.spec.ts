import { inSet, notInSet } from "../../../src";

describe("invertNotInValueCriterion()", () => {
    it("!{1, 2, 3} inverted should be {1, 2, 3}", () => {
        // arrange
        const criterion = notInSet([1, 2, 3]);
        const expected = [inSet([1, 2, 3])];

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });
});
