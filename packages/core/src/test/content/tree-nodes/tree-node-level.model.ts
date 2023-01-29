import { Blueprint } from "../../../lib/schema/blueprint";
import { BlueprintInstance } from "../../../lib/schema/blueprint-instance";
import { define } from "../../../lib/schema/blueprint-property";

@Blueprint({ id: "tree-node-levels" })
export class TreeNodeLevelBlueprint {
    nodeId = define(Number, { id: true, required: true });
    level = define(Number);
}

export type TreeNodeLevel = BlueprintInstance<TreeNodeLevelBlueprint>;
