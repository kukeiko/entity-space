import { Metadata } from "./metadata";

export class TreeNode {
    id: number = 0;
    children?: TreeNode[];
    parent?: TreeNode | null;
    parentIds?: number[];
    parents?: TreeNode[];
    metadata?: Metadata;
    level?: number;
}
