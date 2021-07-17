import { inRange, valueCriteria } from "../../../src";

// [todo] inverting an inversion should result in the original input.

// afaik we'll need mergeCriterion() for that
describe("invertFromToValueCriterion()", () => {
    it("[1, 7] inverted should be [..., 1) | (7, ...]", () => {
        // arrange
        const criterion = inRange(1, 7);
        const expected = valueCriteria([inRange(void 0, 1, false), inRange(7, void 0, false)]);

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });

    it("(1, 7] inverted should be [..., 1] | (7, ...]", () => {
        // arrange
        const criterion = inRange(1, 7, [false, true]);
        const expected = valueCriteria([inRange(void 0, 1), inRange(7, void 0, false)]);

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });

    it("(1, 7) inverted should be [..., 1] | [7, ...]", () => {
        // arrange
        const criterion = inRange(1, 7, false);
        const expected = valueCriteria([inRange(void 0, 1), inRange(7, void 0)]);

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });

    it("[..., 7] inverted should be (7, ...]", () => {
        // arrange
        const criterion = inRange(void 0, 7);
        const expected = valueCriteria([inRange(7, void 0, false)]);

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });

    it("[7, ...] inverted should be [..., 7)", () => {
        // arrange
        const criterion = inRange(7, void 0);
        const expected = valueCriteria([inRange(void 0, 7, false)]);

        // act
        const actual = criterion.invert();

        // assert
        expect(actual).toEqual(expected);
    });
});
