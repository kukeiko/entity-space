import { describe } from "vitest";
import { expectSelection } from "../testing/expect-selection.fn";
import { subtractSelection } from "./subtract-selection.fn";

describe(subtractSelection, () => {
    expectSelection("{ foo }").minus("{ foo }").toEqual(true);
    expectSelection("{ foo }").minus("{ foo, bar }").toEqual(true);
    expectSelection("{ foo, bar }").minus("{ foo }").toEqual("{ bar }");
    expectSelection("{ foo }").minus("{ bar }").toEqual(false);
    expectSelection("{ foo: { bar, baz } }").minus("{ foo: { bar } }").toEqual("{ foo: { baz } }");
    expectSelection("{ foo: { bar } }").minus("{ foo: { baz } }").toEqual(false);
    expectSelection("{ foo: { bar } }").minus("{ foo: { bar } }").toEqual(true);
    expectSelection("{ foo: { bar: { baz } } }").minus("{ foo: { bar: { baz } } }").toEqual(true);

    expectSelection("{ foo }")
        .minus("{ foo: { bar } }")
        .toThrowError("subtraction between incompatible selections on key foo");
    expectSelection("{ foo: { bar } }")
        .minus("{ foo }")
        .toThrowError("subtraction between incompatible selections on key foo");
});
