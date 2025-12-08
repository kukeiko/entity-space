import { EntityBlueprint } from "../../entity/entity-blueprint";
import { RecordMetadataBlueprint } from "../record-metadata.model";
import { TreeBranchBlueprint } from "./tree-branch.model";

const { register, id, string, entity, array } = EntityBlueprint;

/**
 * Used to test recursive embedded relations.
 */
export class TreeBlueprint {
    id = id();
    name = string();
    // [todo] ❌ rename to "rootBranches" to make tests easier to read/comprehend
    branches = entity(TreeBranchBlueprint, { array });
    metadata = entity(RecordMetadataBlueprint);
}

register(TreeBlueprint, { name: "trees" });

export type Tree = EntityBlueprint.Instance<TreeBlueprint>;
export type TreeCreatable = EntityBlueprint.Creatable<TreeBlueprint>;
export type TreeUpdatable = EntityBlueprint.Updatable<TreeBlueprint>;
export type TreeSavable = EntityBlueprint.Savable<TreeBlueprint>;
