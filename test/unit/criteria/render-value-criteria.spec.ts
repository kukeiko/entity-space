import { createFromToValueCriterion, createInValueCriterion, renderInValueCriterion, renderValueCriteria } from "../../../src";

describe("renderValueCriteria()", () => {
    it("should render 1 element without brackets", () => {
        // arrange
        const criteria = [createInValueCriterion([1, 2, 3])];
        const expected = "{1, 2, 3}";

        // act
        const rendered = renderValueCriteria(criteria);

        // assert
        expect(rendered).toEqual(expected);
    });

    it("should render correctly", () => {
        // arrange
        const criteria = [createInValueCriterion([1, 2, 3]), createFromToValueCriterion([0, 7])];
        const expected = "({1, 2, 3} | [0, 7])";

        // act
        const rendered = renderValueCriteria(criteria);

        // assert
        expect(rendered).toEqual(expected);
    });
});
