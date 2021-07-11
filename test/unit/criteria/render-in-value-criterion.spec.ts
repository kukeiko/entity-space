import { inSet } from "../../../src";

describe("renderInValueCriterion", () => {
    it("should render correctly", () => {
        // arrange
        const criterion = inSet([1, 2, 3]);
        const expected = "{1, 2, 3}";

        // act
        const actual = criterion.toString();

        // assert
        expect(actual).toEqual(expected);
    });
});
