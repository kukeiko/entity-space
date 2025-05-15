import { describe, expect, it } from "vitest";
import { EntitySelection } from "./entity-selection.mjs";
import { parseSelection } from "./parse-selection.fn.mjs";

describe(parseSelection, () => {
    it("should work", () => {
        // arrange
        const expected: EntitySelection = { foo: { bar: true } };
        const input: string = "{ foo: { bar }}";

        // act
        const actual = parseSelection(input);

        // assert
        expect(actual).toEqual(expected);
    });
});
