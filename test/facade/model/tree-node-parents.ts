import { TreeNode } from "./tree-node";
import { PartialFields } from "src";
import { Property } from "../../../src/advanced/property";

export class TreeNodeParents {
    constructor(args?: PartialFields<TreeNodeParents>) {
        Object.assign(this, args || {});
    }

    childId = Property.create("childId", Number, b => b.loadable());
    parents = Property.create("parents", TreeNode, b => b.loadable().iterable());
}
