import { Blueprint, BlueprintInstance, define } from "@entity-space/core";
import { DataEntryBlueprint } from "../common/data-entry.model";

/**
 * Example of a model that is a tree, i.e. it has its own type as a parent and as children.
 *
 * We support loading all the parents by having a single property that contains them all, which in our
 * case is loaded separately using a TreeNodeParentsQuery.
 */
@Blueprint({ id: "tree-nodes" })
export class TreeNodeBlueprint extends DataEntryBlueprint {
    id = define(Number, { id: true, required: true, readOnly: true });
    children = define(TreeNodeBlueprint, { array: true, readOnly: true });
    name = define(String);
    parentId = define(Number, { nullable: true, required: true });
    parent = define(TreeNodeBlueprint, { nullable: true });
    parentIds = define(Number, { array: true, readOnly: true });
    parents = define(TreeNodeBlueprint, { array: true, readOnly: true });
    level = define(Number, { readOnly: true });
}

export type TreeNode = BlueprintInstance<TreeNodeBlueprint>;
