import { EntityBlueprint } from "../../entity/entity-blueprint";
import { RecordMetadataBlueprint } from "../common/record-metadata.model";
import { TreeLeafBlueprint } from "./tree-leaf.model";

const { register, entity, array } = EntityBlueprint;

export class TreeBranchBlueprint {
    branches = entity(TreeBranchBlueprint, { array });
    leaves = entity(TreeLeafBlueprint, { array });
    metadata = entity(RecordMetadataBlueprint);
}

register(TreeBranchBlueprint, { name: "tree-branches" });

export type TreeBranch = EntityBlueprint.Type<TreeBranchBlueprint>;
