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
    expectSelection("{ id, foo: * }").minus("{ id, foo: * }").toEqual(true);
    expectSelection("{ id, name, foo: * }").minus("{ id, foo: * }").toEqual("{ name, foo: * }");
    expectSelection("{ foo: *, id }").minus("{ id, foo: * }").toEqual(true);
    expectSelection("{ foo: { id, bar: * } }")
        .minus("{ foo: *, id }")
        .toEqual("{ foo: { bar: { foo: { bar: *, id } } } }");
    expectSelection("{ foo: { id, bar: * } }").minus("{ foo: { id, bar: * } }").toEqual(true);
    expectSelection("{ foo: { id, bar: *, name } }")
        .minus("{ foo: { id, bar: * } }")
        .toEqual("{ foo: { bar: *, name } }");
    expectSelection("{ id, foo: { id, name, bar: { id, name, bar: * } }, khaz: { id, mo: { id, name, dan: { mo: * } } } }")
        .minus("{ id, foo: { name, bar: { name, bar: * } }, khaz: { mo: { name, dan: { mo: * } } } }")
        .toEqual("{ foo: { id, bar: { id, bar: * } }, khaz: { id, mo: { id, dan: { mo: * } } } }");

    expectSelection("{ foo }")
        .minus("{ foo: { bar } }")
        .toThrowError("subtraction between incompatible selections on key foo");
    expectSelection("{ foo: { bar } }")
        .minus("{ foo }")
        .toThrowError("subtraction between incompatible selections on key foo");
});
