import { define } from "src";
import { TreeNodeModel } from "./tree-node.model";

export class TreeNodeParentsModel {
    childId = define(Number, { id: true, required: true });
    parents = define(TreeNodeModel, { array: true });
}