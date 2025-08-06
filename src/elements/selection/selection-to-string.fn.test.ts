import { describe, expect, it } from "vitest";
import { EntitySelection } from "./entity-selection";
import { selectionToString } from "./selection-to-string.fn";

describe(selectionToString, () => {
    it("should work on a recursive selection", () => {
        // arrange
        // arrange
        const selection = {
            id: true,
            name: true,
            rootBranches: {
                branches: {}, // recursive
                leaves: { color: true },
            },
        } satisfies EntitySelection;

        selection.rootBranches.branches = selection.rootBranches;

        const expected = "{ id, name, rootBranches: { branches: *, leaves: { color } } }";

        // act
        const actual = selectionToString(selection);

        // assert
        expect(actual).toEqual(expected);
    });
});
