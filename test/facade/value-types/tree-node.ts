import { Entity, EntityTypeMetadata } from "src";
import { Metadata } from "./metadata";

export class TreeNode extends Entity<TreeNode, typeof TreeNode> {
    static getMetadata(): EntityTypeMetadata<TreeNode> {
        return {} as any;
    }

    id: number = 0;
    children?: TreeNode[];
    parent?: TreeNode | null;
    parentIds?: number[];
    parents?: TreeNode[];
    metadata?: Metadata;
    level?: number;
}
