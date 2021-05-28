import { notInSet, renderNotInSet } from "../../../src";

describe("renderNotInValueCriterion", () => {
    it("should render correctly", () => {
        // arrange
        const criterion = notInSet([1, 2, 3]);
        const expected = "!{1, 2, 3}";

        // act
        const actual = renderNotInSet(criterion);

        // assert
        expect(actual).toEqual(expected);
    });
});
