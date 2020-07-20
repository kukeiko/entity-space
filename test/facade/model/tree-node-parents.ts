import { TreeNode } from "./tree-node";
import { PartialFields } from "src";

export class TreeNodeParents {
    constructor(args?: PartialFields<TreeNodeParents>) {
        Object.assign(this, args || {});
    }

    childId: number = 0;
    parents: TreeNode[] = [];
}
