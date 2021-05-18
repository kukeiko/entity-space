import { createFromToValueCriterion, invertFromToValueCriterion } from "../../../src";

// [todo] inverting an inversion should result in the original input.
// afaik we'll need mergeCriterion() for that
describe("invertFromToValueCriterion()", () => {
    it("[1, 7] inverted should be [..., 1) | (7, ...]", () => {
        // arrange
        const criterion = createFromToValueCriterion([1, 7]);
        const expected = [createFromToValueCriterion([void 0, 1], false), createFromToValueCriterion([7, void 0], false)];

        // act
        const actual = invertFromToValueCriterion(criterion);

        // assert
        expect(actual).toEqual(expected);
    });

    it("(1, 7] inverted should be [..., 1] | (7, ...]", () => {
        // arrange
        const criterion = createFromToValueCriterion([1, 7], [false, true]);
        const expected = [createFromToValueCriterion([void 0, 1]), createFromToValueCriterion([7, void 0], false)];

        // act
        const actual = invertFromToValueCriterion(criterion);

        // assert
        expect(actual).toEqual(expected);
    });

    it("(1, 7) inverted should be [..., 1] | [7, ...]", () => {
        // arrange
        const criterion = createFromToValueCriterion([1, 7], false);
        const expected = [createFromToValueCriterion([void 0, 1]), createFromToValueCriterion([7, void 0])];

        // act
        const actual = invertFromToValueCriterion(criterion);

        // assert
        expect(actual).toEqual(expected);
    });

    it("[..., 7] inverted should be (7, ...]", () => {
        // arrange
        const criterion = createFromToValueCriterion([void 0, 7]);
        const expected = [createFromToValueCriterion([7, void 0], false)];

        // act
        const actual = invertFromToValueCriterion(criterion);

        // assert
        expect(actual).toEqual(expected);
    });

    it("[7, ...] inverted should be [..., 7)", () => {
        // arrange
        const criterion = createFromToValueCriterion([7, void 0]);
        const expected = [createFromToValueCriterion([void 0, 7], false)];

        // act
        const actual = invertFromToValueCriterion(criterion);

        // assert
        expect(actual).toEqual(expected);
    });
});
