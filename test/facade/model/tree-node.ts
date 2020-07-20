import { Metadata } from "./metadata";
import { PartialFields } from "src";
import { User } from "./user";

export class TreeNode {
    constructor(args?: PartialFields<TreeNode>) {
        Object.assign(this, args || {});
    }

    id: number = 0;
    children?: TreeNode[];
    createdBy?: User;
    name: string = "";
    parent?: TreeNode | null;
    parentId: number | null = null;
    parentIds?: number[];
    parents?: TreeNode[];
    metadata?: Metadata;
    level?: number;
    updatedBy?: User;
}
