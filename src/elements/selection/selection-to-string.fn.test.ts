import { describe, expect, it } from "vitest";
import { selectionToString } from "./selection-to-string.fn";

describe(selectionToString, () => {
    it("should work on a recursive selection", () => {
        // arrange
        const selection = {
            foo: { bar: {} },
            khaz: { mo: { dan: { khaz: { mo: {} } } } },
        };
        selection.foo.bar = selection;
        selection.khaz.mo.dan.khaz.mo = selection.khaz.mo;

        const expected = "{ foo: { bar: * }, khaz: { mo: { dan: { khaz: { mo: * } } } } }";

        // act
        const actual = selectionToString(selection);

        // assert
        expect(actual).toEqual(expected);
    });
});
