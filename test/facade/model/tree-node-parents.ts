import { TreeNode } from "./tree-node";
import { createProperty } from "src";

export class TreeNodeParents {
    childId = createProperty("childId", Number, b => b.loadable());
    parents = createProperty("parents", TreeNode, b => b.loadable().iterable());
}
