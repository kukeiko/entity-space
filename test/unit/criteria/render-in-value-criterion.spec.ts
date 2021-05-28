import { inSet, renderInSet } from "../../../src";

describe("renderInValueCriterion", () => {
    it("should render correctly", () => {
        // arrange
        const criterion = inSet([1, 2, 3]);
        const expected = "{1, 2, 3}";

        // act
        const actual = renderInSet(criterion);

        // assert
        expect(actual).toEqual(expected);
    });
});
