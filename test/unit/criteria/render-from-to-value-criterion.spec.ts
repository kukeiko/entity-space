import { inRange, renderInRange } from "../../../src";

describe("renderFromToValueCriterion", () => {
    it("[1, 7] should be rendered correctly", () => {
        // arrange
        const criterion = inRange([1, 7]);
        const expected = "[1, 7]";

        // act
        const actual = renderInRange(criterion);

        // assert
        expect(actual).toEqual(expected);
    });

    it("(1, 7] should be rendered correctly", () => {
        // arrange
        const criterion = inRange([1, 7], [false, true]);
        const expected = "(1, 7]";

        // act
        const actual = renderInRange(criterion);

        // assert
        expect(actual).toEqual(expected);
    });

    it("[1, 7) should be rendered correctly", () => {
        // arrange
        const criterion = inRange([1, 7], [true, false]);
        const expected = "[1, 7)";

        // act
        const actual = renderInRange(criterion);

        // assert
        expect(actual).toEqual(expected);
    });

    it("(1, 7) should be rendered correctly", () => {
        // arrange
        const criterion = inRange([1, 7], false);
        const expected = "(1, 7)";

        // act
        const actual = renderInRange(criterion);

        // assert
        expect(actual).toEqual(expected);
    });

    it("[..., 7) should be rendered correctly", () => {
        // arrange
        const criterion = inRange([void 0, 7], false);
        const expected = "[..., 7)";

        // act
        const actual = renderInRange(criterion);

        // assert
        expect(actual).toEqual(expected);
    });

    it("(7, ...] should be rendered correctly", () => {
        // arrange
        const criterion = inRange([7, void 0], false);
        const expected = "(7, ...]";

        // act
        const actual = renderInRange(criterion);

        // assert
        expect(actual).toEqual(expected);
    });
});
