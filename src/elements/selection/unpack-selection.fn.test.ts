import { describe, expect, it } from "vitest";
import { EntitySchemaCatalog } from "../entity/entity-schema-catalog";
import {
    Folder,
    FolderBlueprint,
    RecordMetadata,
    RecordMetadataBlueprint,
    Tree,
    TreeBlueprint,
    TreeBranchBlueprint,
} from "../testing";
import { PackedEntitySelection, TypedEntitySelection } from "./entity-selection";
import { getDefaultSelection } from "./get-default-selection.fn";
import { unpackSelection } from "./unpack-selection.fn";

describe(unpackSelection, () => {
    it("should work w/o selection", () => {
        // arrange
        const expectedMetadataSelection: TypedEntitySelection<RecordMetadata> = {
            createdAt: true,
            createdById: true,
            updatedAt: true,
            updatedById: true,
        };

        const expected = {
            id: true,
            name: true,
            metadata: expectedMetadataSelection,
            branches: {
                metadata: expectedMetadataSelection,
                leaves: {
                    color: true,
                    metadata: expectedMetadataSelection,
                },
                branches: {}, // recursive
            },
        } satisfies TypedEntitySelection<Tree>;

        expected.branches.branches = expected.branches;

        const schema = new EntitySchemaCatalog().getSchemaByBlueprint(TreeBlueprint);

        // act
        const actual = unpackSelection(schema, {});

        // assert
        expect(actual).toEqual(expected);
    });

    it("should not mutate recursive entries", () => {
        // arrange
        const catalog = new EntitySchemaCatalog();
        const treeSchema = catalog.getSchemaByBlueprint(TreeBlueprint);
        const treeBranchesSchema = catalog.getSchemaByBlueprint(TreeBranchBlueprint);
        const metadataSchema = catalog.getSchemaByBlueprint(RecordMetadataBlueprint);

        const selection = {
            branches: {
                // because we're making a selection on "branches", we need to make sure to not use the recursive "branches" selection
                // from the default selection of "Tree"
                metadata: { createdBy: true },
            },
        } satisfies PackedEntitySelection<Tree>;

        const defaultTreeSelection = getDefaultSelection(treeSchema);
        const defaultTreeBranchesSelection = getDefaultSelection(treeBranchesSchema);
        const defaultMetadataSelection = getDefaultSelection(metadataSchema);

        const expected = {
            ...defaultTreeSelection,
            branches: {
                ...defaultTreeBranchesSelection,
                branches: defaultTreeBranchesSelection,
                metadata: {
                    ...defaultMetadataSelection,
                    createdBy: {
                        id: true,
                        name: true,
                        metadata: defaultMetadataSelection,
                    },
                },
            },
        } satisfies TypedEntitySelection<Tree>;

        const schema = new EntitySchemaCatalog().getSchemaByBlueprint(TreeBlueprint);

        // act
        const actual = unpackSelection(schema, selection);

        // assert
        expect(actual).toEqual(expected);
    });

    it("should work for a recursive selection using joined relations", () => {
        // arrange
        const selection = {
            folders: {}, // recursive
        } satisfies PackedEntitySelection<Folder>;
        selection.folders = selection;

        const expected = {
            id: true,
            name: true,
            parentId: true,
            metadata: {
                createdAt: true,
                createdById: true,
                updatedAt: true,
                updatedById: true,
            },
            folders: {}, // recursive
        } satisfies TypedEntitySelection<Folder>;
        expected.folders = expected;

        const schema = new EntitySchemaCatalog().getSchemaByBlueprint(FolderBlueprint);

        // act
        const actual = unpackSelection(schema, selection);

        // assert
        expect(actual).toEqual(expected);
    });

    it("should throw when using multiple recursive entries on the same level", () => {
        // arrange
        const schema = new EntitySchemaCatalog().getSchemaByBlueprint(FolderBlueprint);
        const selection = {
            folders: {}, // recursive
            parent: {}, // recursive
        } satisfies PackedEntitySelection<Folder>;
        selection.folders = selection;
        selection.parent = selection;

        // act
        const unpack = () => unpackSelection(schema, selection);

        // assert
        expect(unpack).toThrowError("a selection with multiple recursive entries on the same level is not supported");
    });
});
