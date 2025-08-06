import { describe } from "vitest";
import { expectSelection } from "../testing/expect-selection.fn";
import { intersectSelection } from "./intersect-selection.fn";

describe(intersectSelection, () => {
    expectSelection("{ foo }").intersect("{ foo }").toEqual("{ foo }");
    expectSelection("{ foo, bar }").intersect("{ foo }").toEqual("{ foo }");
    expectSelection("{ foo }").intersect("{ foo, bar }").toEqual("{ foo }");
    expectSelection("{ foo: { bar } }").intersect("{ foo: { bar, baz } }").toEqual("{ foo: { bar } }");
    expectSelection("{ foo: { bar } }").intersect("{ foo: { baz } }").toEqual(false);

    {
        // recursive selections
        expectSelection("{ id, foo: * }").intersect("{ id, foo: * }").toEqual("{ id, foo: * }");
        expectSelection("{ id, foo: * }").intersect("{ id, name, foo: * }").toEqual("{ id, foo: * }");
        expectSelection("{ id, foo: { bar: { id, name, bar: * } } }")
            .intersect("{ id, foo: { bar: { id, bar: * } } }")
            .toEqual("{ id, foo: { bar: { id, bar: * } } }");
        expectSelection("{ foo: { bar: { id, name } } }")
            .intersect("{ foo: { bar: { id, name, bar: * } } }")
            .toEqual("{ foo: { bar: { id, name } } }");
        expectSelection("{ foo: { bar: { id, name, bar: { id, name } } } }")
            .intersect("{ foo: { bar: { id, name, bar: * } } }")
            .toEqual("{ foo: { bar: { id, name, bar: { id, name } } } }");
        expectSelection("{ branches: { branches: *, metadata: { createdById, createdBy } } }")
            .intersect("{ branches: { branches: *, metadata: { createdById } } }")
            .toEqual("{ branches: { branches: *, metadata: { createdById } } }");
    }

    expectSelection("{ foo }")
        .intersect("{ foo: { bar } }")
        .toThrowError("intersection between incompatible selections on key foo");
});
