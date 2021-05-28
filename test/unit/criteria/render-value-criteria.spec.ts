import { inRange, inSet, renderInSet, renderValueCriteria } from "../../../src";

describe("renderValueCriteria()", () => {
    it("should render 1 element without brackets", () => {
        // arrange
        const criteria = [inSet([1, 2, 3])];
        const expected = "{1, 2, 3}";

        // act
        const rendered = renderValueCriteria(criteria);

        // assert
        expect(rendered).toEqual(expected);
    });

    it("should render correctly", () => {
        // arrange
        const criteria = [inSet([1, 2, 3]), inRange([0, 7])];
        const expected = "({1, 2, 3} | [0, 7])";

        // act
        const rendered = renderValueCriteria(criteria);

        // assert
        expect(rendered).toEqual(expected);
    });
});
