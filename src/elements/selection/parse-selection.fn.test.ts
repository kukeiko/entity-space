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

    it("should work on a simple recursive selection", () => {
        // arrange
        const expected = { id: true, foo: {} };
        expected.foo = expected;

        // act
        const actual = parseSelection("{ id, foo: * }");

        // assert
        expect(actual).toEqual(expected);
    });

    it("should work on a complex recursive selection", () => {
        // arrange
        const expected = {
            id: true,
            metadata: { createdAt: true, createdById: true },
            name: true,
            rootBranches: {
                branches: {}, // recursive
                leaves: { color: true, metadata: { createdAt: true, createdById: true } },
                metadata: { createdAt: true, createdById: true },
            },
        };

        expected.rootBranches.branches = expected.rootBranches;

        const input = `
        {
            id,
            metadata: { createdAt, createdById },
            name,
            rootBranches: {
                branches: *,
                leaves: { color, metadata: { createdAt, createdById } },
                metadata: { createdAt, createdById }
            }
        }`;

        // act
        const actual = parseSelection(input);

        // assert
        expect(actual).toEqual(expected);
    });
});
