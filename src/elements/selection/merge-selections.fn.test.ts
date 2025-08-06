import { describe, expect, it } from "vitest";
import { mergeSelections } from "./merge-selections.fn";
import { parseSelection } from "./parse-selection.fn";

describe(mergeSelections, () => {
    it("should work", () => {
        // arrange
        const selections = [parseSelection("{ a }"), parseSelection("{ b }"), parseSelection("{ c }")];
        const expected = parseSelection("{ a, b, c }");

        // act
        const actual = mergeSelections(selections);

        // assert
        expect(actual).toEqual(expected);
    });
});
