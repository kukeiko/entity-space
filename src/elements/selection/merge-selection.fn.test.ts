import { describe } from "vitest";
import { expectSelection } from "../testing/expect-selection.fn";
import { mergeSelection } from "./merge-selection.fn";

describe(mergeSelection, () => {
    expectSelection("{ foo }").plus("{ bar }").toEqual("{ foo, bar }");
    expectSelection("{ foo }").plus("{ foo }").toEqual("{ foo }");
    expectSelection("{ foo: { bar } }").plus("{ foo: { baz } }").toEqual("{ foo: { bar, baz } }");

    {
        // recursive selections
        expectSelection("{ foo: * }").plus("{ bar: * }").toEqual("{ foo: { foo: * }, bar: { bar: * } }");
        expectSelection("{ foo: * }").plus("{ foo: * }").toEqual("{ foo: * }");
        expectSelection("{ foo: * }").plus("{ id, foo: * }").toEqual("{ id, foo: * }");
        expectSelection("{ foo: * }").plus("{ id }").toEqual("{ id, foo: { foo: * } }");
        expectSelection("{ foo: { id, foo: * } }")
            .plus("{ foo: { name } }")
            .toEqual("{ foo: { id, name, foo: { id, foo: * } } }");
        expectSelection("{ foo: { id, foo: * } }")
            .plus("{ foo: { name, foo: * } }")
            .toEqual("{ foo: { id, name, foo: * } }");
    }

    expectSelection("{ foo }")
        .plus("{ foo: { bar } }")
        .toThrowError("merge between incompatible selections on key foo");
});
