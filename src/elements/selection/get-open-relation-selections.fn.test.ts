import { Path, toPath } from "@entity-space/utils";
import { describe, expect, it } from "vitest";
import { EntitySelection } from "./entity-selection";
import { getOpenRelationSelections } from "./get-open-relation-selections.fn";

describe(getOpenRelationSelections, () => {
    it("should work", () => {
        // arrange
        const required: EntitySelection = {
            foo: { id: true, name: true },
            bar: { id: true, name: true, baz: { id: true, name: true } },
        };
        const supported: EntitySelection = { id: true, name: true, bar: { id: true, name: true } };
        const expected: [Path, EntitySelection][] = [
            [toPath("foo"), { id: true, name: true }],
            [toPath("bar.baz"), { id: true, name: true }],
        ];

        // act
        const actual = getOpenRelationSelections(required, supported);

        // assert
        expect(actual).toEqual(expected);
    });
});
