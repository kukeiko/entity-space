import { describe, test } from "vitest";
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

    {
        // recursive selections
        expectSelection("{ id, foo: * }").minus("{ id, foo: * }").toEqual(true);
        expectSelection("{ id, name, foo: * }").minus("{ id, foo: * }").toEqual("{ name, foo: * }");
        expectSelection("{ foo: *, id }").minus("{ id, foo: * }").toEqual(true);
        expectSelection("{ foo: *, id, name }").minus("{ foo: *, name }").toEqual("{ foo: *, id }");
        // [todo] ❌ not yet sure how set math on selections with multiple recursions is supposed to work
        expectSelection("{ id, foo: *, bar: * }", test.skip).minus("{ id, bar: * }").toEqual("{ id, foo: * }");
        expectSelection("{ foo: { id, bar: * } }").minus("{ foo: { id, bar: * } }").toEqual(true);
        expectSelection("{ foo: { id, bar: *, name } }")
            .minus("{ foo: { id, bar: * } }")
            .toEqual("{ foo: { bar: *, name } }");
        expectSelection("{ foo: { khaz: *, id, name }, bar: { mo: *, id, name } }")
            .minus("{ foo: { khaz: *, id }, bar: { mo: *, id } }")
            .toEqual("{ foo: { khaz: *, name }, bar: { mo: *, name } }");
        expectSelection("{ branches: *, metadata: { createdById, createdBy } }")
            .minus("{ branches: *, metadata: { createdById } }")
            .toEqual("{ branches: *, metadata: { createdBy } }");
    }

    expectSelection("{ foo }")
        .minus("{ foo: { bar } }")
        .toThrowError("subtraction between incompatible selections on key foo");
    expectSelection("{ foo: { bar } }")
        .minus("{ foo }")
        .toThrowError("subtraction between incompatible selections on key foo");
});
