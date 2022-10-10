import { Blueprint, BlueprintInstance, define } from "@entity-space/common";

@Blueprint({ id: "tree-node-levels" })
export class TreeNodeLevelBlueprint {
    nodeId = define(Number, { id: true, required: true });
    level = define(Number);
}

export type TreeNodeLevel = BlueprintInstance<TreeNodeLevelBlueprint>;
