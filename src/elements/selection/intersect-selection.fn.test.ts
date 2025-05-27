import { describe } from "vitest";
import { expectSelection } from "../testing/expect-selection.fn";
import { intersectSelection } from "./intersect-selection.fn";

describe(intersectSelection, () => {
    expectSelection("{ foo }").intersect("{ foo }").toEqual("{ foo }");
    expectSelection("{ foo, bar }").intersect("{ foo }").toEqual("{ foo }");
    expectSelection("{ foo }").intersect("{ foo, bar }").toEqual("{ foo }");
    expectSelection("{ foo: { bar } }").intersect("{ foo: { bar, baz } }").toEqual("{ foo: { bar } }");
    expectSelection("{ foo: { bar } }").intersect("{ foo: { baz } }").toEqual(false);
    expectSelection("{ foo }")
        .intersect("{ foo: { bar } }")
        .toThrowError("intersection between incompatible selections on key foo");
});
