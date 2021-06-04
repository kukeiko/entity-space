import { InRangeCriterion } from "../../../src";

// [todo] inverting an inversion should result in the original input.

// afaik we'll need mergeCriterion() for that
describe("invertFromToValueCriterion()", () => {
    it("[1, 7] inverted should be [..., 1) | (7, ...]", () => {
        // arrange
        const criterion = new InRangeCriterion(Number, [1, 7]);
        const expected = [new InRangeCriterion(Number, [void 0, 1], false), new InRangeCriterion(Number, [7, void 0], false)];

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });

    it("(1, 7] inverted should be [..., 1] | (7, ...]", () => {
        // arrange
        const criterion = new InRangeCriterion(Number, [1, 7], [false, true]);
        const expected = [new InRangeCriterion(Number, [void 0, 1]), new InRangeCriterion(Number, [7, void 0], false)];

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });

    it("(1, 7) inverted should be [..., 1] | [7, ...]", () => {
        // arrange
        const criterion = new InRangeCriterion(Number, [1, 7], false);
        const expected = [new InRangeCriterion(Number, [void 0, 1]), new InRangeCriterion(Number, [7, void 0])];

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });

    it("[..., 7] inverted should be (7, ...]", () => {
        // arrange
        const criterion = new InRangeCriterion(Number, [void 0, 7]);
        const expected = [new InRangeCriterion(Number, [7, void 0], false)];

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });

    it("[7, ...] inverted should be [..., 7)", () => {
        // arrange
        const criterion = new InRangeCriterion(Number, [7, void 0]);
        const expected = [new InRangeCriterion(Number, [void 0, 7], false)];

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });
});
