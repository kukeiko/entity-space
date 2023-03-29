import { EntityBlueprint } from "../../../lib/schema/entity-blueprint";
import { EntityBlueprintInstance } from "../../../lib/schema/entity-blueprint-instance.type";
import { define } from "../../../lib/schema/entity-blueprint-property";

@EntityBlueprint({ id: "tree-node-levels" })
export class TreeNodeLevelBlueprint {
    nodeId = define(Number, { id: true, required: true });
    level = define(Number);
}

export type TreeNodeLevel = EntityBlueprintInstance<TreeNodeLevelBlueprint>;
