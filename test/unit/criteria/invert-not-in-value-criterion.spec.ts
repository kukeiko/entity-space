import { inSet, notInSet, invertNotInSet } from "../../../src";

describe("invertNotInValueCriterion()", () => {
    it("!{1, 2, 3} inverted should be {1, 2, 3}", () => {
        // arrange
        const criterion = notInSet([1, 2, 3]);
        const expected = [inSet([1, 2, 3])];

        // act
        const actual = invertNotInSet(criterion);

        // assert
        expect(actual).toEqual(expected);
    });
});
