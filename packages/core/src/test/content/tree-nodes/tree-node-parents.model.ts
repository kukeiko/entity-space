import { Blueprint, BlueprintInstance, define } from "@entity-space/core";
import { TreeNodeBlueprint } from "./tree-node.model";

@Blueprint({ id: "tree-node-parents" })
export class TreeNodeParentsBlueprint {
    childId = define(Number, { id: true, required: true });
    parents = define(TreeNodeBlueprint, { array: true });
}

export type TreeNodeParents = BlueprintInstance<TreeNodeParentsBlueprint>;
