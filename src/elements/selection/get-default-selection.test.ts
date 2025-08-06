import { describe, expect, it } from "vitest";
import { EntitySchemaCatalog } from "../entity/entity-schema-catalog";
import { Tree, TreeBlueprint } from "../testing";
import { TypedEntitySelection } from "./entity-selection";
import { getDefaultSelection } from "./get-default-selection.fn";

describe(getDefaultSelection, () => {
    it("should support a recursive schema", () => {
        // arrange
        const catalog = new EntitySchemaCatalog();
        const schema = catalog.getSchemaByBlueprint(TreeBlueprint);
        const expected = {
            id: true,
            name: true,
            branches: {
                branches: {}, // recursive
                leaves: {
                    color: true,
                    metadata: { createdAt: true, createdById: true, updatedAt: true, updatedById: true },
                },
                metadata: { createdAt: true, createdById: true, updatedAt: true, updatedById: true },
            },
            metadata: { createdAt: true, createdById: true, updatedAt: true, updatedById: true },
        } satisfies TypedEntitySelection<Tree>;

        expected.branches.branches = expected.branches;

        // act
        const actual = getDefaultSelection(schema);

        // assert
        expect(actual).toEqual(expected);
    });
});
