import { EntityBlueprint } from "../../entity/blueprint/entity-blueprint";
import { RecordMetadataBlueprint } from "../common/record-metadata.model";
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

export type Tree = EntityBlueprint.Type<TreeBlueprint>;
