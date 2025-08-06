import { Path, toPath } from "@entity-space/utils";
import { describe, expect, it } from "vitest";
import { EntitySchema } from "../entity/entity-schema";
import { EntitySchemaCatalog } from "../entity/entity-schema-catalog";
import { RecordMetadataBlueprint, Tree, TreeBlueprint, TreeBranchBlueprint, TreeLeafBlueprint } from "../testing";
import { PackedEntitySelection } from "./entity-selection";
import { getDefaultSelection } from "./get-default-selection.fn";
import { selectionToPathedRelatedSchemas } from "./selection-to-pathed-related-schemas.fn";
import { unpackSelection } from "./unpack-selection.fn";

function sortByPath(items: [Path, EntitySchema][]): [Path, EntitySchema][] {
    return items.sort((a, b) => a[0].localeCompare(b[0].toString()));
}

describe(selectionToPathedRelatedSchemas, () => {
    it("should work using only a default selection containing recursion", () => {
        // arrange
        const catalog = new EntitySchemaCatalog();
        const metadataSchema = catalog.getSchemaByBlueprint(RecordMetadataBlueprint);
        const treeSchema = catalog.getSchemaByBlueprint(TreeBlueprint);
        const treeBranchesSchema = catalog.getSchemaByBlueprint(TreeBranchBlueprint);
        const treeLeavesSchema = catalog.getSchemaByBlueprint(TreeLeafBlueprint);

        const selection = getDefaultSelection(treeSchema);
        const expected: [Path, EntitySchema][] = [
            [toPath("metadata"), metadataSchema],
            [toPath("branches"), treeBranchesSchema],
            [toPath("branches.metadata"), metadataSchema],
            [toPath("branches.leaves"), treeLeavesSchema],
            [toPath("branches.leaves.metadata"), metadataSchema],
        ];

        // act
        const actual = selectionToPathedRelatedSchemas(treeSchema, selection);

        // assert
        expect(actual.length).toEqual(expected.length);
        expect(sortByPath(actual)).toEqual(sortByPath(expected));
    });

    it("should work using a selection on a recursive schema", () => {
        // arrange
        const selection = {
            branches: {
                metadata: { createdBy: true, updatedBy: true },
            },
        } satisfies PackedEntitySelection<Tree>;
        const catalog = new EntitySchemaCatalog();
        const metadataSchema = catalog.getSchemaByBlueprint(RecordMetadataBlueprint);
        const treeSchema = catalog.getSchemaByBlueprint(TreeBlueprint);
        const treeBranchesSchema = catalog.getSchemaByBlueprint(TreeBranchBlueprint);
        const treeLeavesSchema = catalog.getSchemaByBlueprint(TreeLeafBlueprint);

        const unpacked = unpackSelection(treeSchema, selection);
        const expected: [Path, EntitySchema][] = [
            [toPath("metadata"), metadataSchema],
            [toPath("branches"), treeBranchesSchema],
            [toPath("branches.metadata"), metadataSchema],
            [toPath("branches.metadata.createdBy"), metadataSchema],
            [toPath("branches.metadata.createdBy.metadata"), metadataSchema],
            [toPath("branches.metadata.updatedBy"), metadataSchema],
            [toPath("branches.metadata.updatedBy.metadata"), metadataSchema],
            [toPath("branches.leaves"), treeLeavesSchema],
            [toPath("branches.leaves.metadata"), metadataSchema],
            [toPath("branches.branches"), metadataSchema],
            [toPath("branches.branches.metadata"), metadataSchema],
            [toPath("branches.branches.leaves"), treeLeavesSchema],
            [toPath("branches.branches.leaves.metadata"), metadataSchema],
        ];

        // act
        const actual = selectionToPathedRelatedSchemas(treeSchema, unpacked);

        // assert
        expect(actual.length).toEqual(expected.length);
        expect(sortByPath(actual)).toEqual(sortByPath(expected));
    });
});
