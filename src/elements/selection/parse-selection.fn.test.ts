import { describe, expect, it } from "vitest";
import { EntitySelection } from "./entity-selection";
import { parseSelection } from "./parse-selection.fn";

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

    it("should work on a recursive selection", () => {
        // arrange
        const expected = {
            foo: { bar: {} },
            khaz: { mo: { dan: { khaz: { mo: {} } } } },
        };
        expected.foo.bar = expected;
        expected.khaz.mo.dan.khaz.mo = expected.khaz.mo;

        const input = "{ foo: { bar: * }, khaz: { mo: { dan: { khaz: { mo: * } } } } }";

        // act
        const actual = parseSelection(input);

        // assert
        expect(actual).toEqual(expected);
    });
});
