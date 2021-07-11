import { inRange, inSet, valueMatches } from "../../../src";

describe("renderValueCriteria()", () => {
    it("should render 1 element without brackets", () => {
        // arrange
        const criteria = valueMatches([inSet([1, 2, 3])]);
        const expected = "{1, 2, 3}";

        // act
        const rendered = criteria.toString();

        // assert
        expect(rendered).toEqual(expected);
    });

    it("should render correctly", () => {
        // arrange
        const criteria = valueMatches([inSet([1, 2, 3]), inRange(0, 7)]);
        const expected = "({1, 2, 3} | [0, 7])";

        // act
        const rendered = criteria.toString();

        // assert
        expect(rendered).toEqual(expected);
    });
});
