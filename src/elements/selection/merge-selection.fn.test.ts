import { describe } from "vitest";
import { expectSelection } from "../testing/expect-selection.fn";
import { mergeSelection } from "./merge-selection.fn";

describe(mergeSelection, () => {
    expectSelection("{ foo }").plus("{ bar }").toEqual("{ foo, bar }");
    expectSelection("{ foo }").plus("{ foo }").toEqual("{ foo }");
    expectSelection("{ foo: { bar } }").plus("{ foo: { baz } }").toEqual("{ foo: { bar, baz } }");
    expectSelection("{ foo }")
        .plus("{ foo: { bar } }")
        .toThrowError("merge between incompatible selections on key foo");
});
