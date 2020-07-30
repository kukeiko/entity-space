import { createProperty } from "src";
import { TreeNodeModel } from "./tree-node.model";

export class TreeNodeParentsModel {
    childId = createProperty("childId", [Number], b => b.loadable());
    parents = createProperty("parents", [TreeNodeModel], b => b.loadable().iterable());
}
