import { EntityBlueprint } from "../../../lib/schema/entity-blueprint";
import { EntityBlueprintInstance } from "../../../lib/schema/entity-blueprint-instance.type";
import { define } from "../../../lib/schema/entity-blueprint-property";
import { TreeNodeBlueprint } from "./tree-node.model";

@EntityBlueprint({ id: "tree-node-parents" })
export class TreeNodeParentsBlueprint {
    childId = define(Number, { id: true, required: true });
    parents = define(TreeNodeBlueprint, { array: true });
}

export type TreeNodeParents = EntityBlueprintInstance<TreeNodeParentsBlueprint>;
