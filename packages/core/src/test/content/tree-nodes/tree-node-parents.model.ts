import { Blueprint } from "../../../lib/schema/blueprint";
import { BlueprintInstance } from "../../../lib/schema/blueprint-instance";
import { define } from "../../../lib/schema/blueprint-property";
import { TreeNodeBlueprint } from "./tree-node.model";

@Blueprint({ id: "tree-node-parents" })
export class TreeNodeParentsBlueprint {
    childId = define(Number, { id: true, required: true });
    parents = define(TreeNodeBlueprint, { array: true });
}

export type TreeNodeParents = BlueprintInstance<TreeNodeParentsBlueprint>;
