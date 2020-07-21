import { Query, Selection } from "src";
import { TreeNode } from "../model";

// export class TreeNodeQuery<S extends Query.Selection<TreeNode> = {}> extends Query<TreeNode, S> {
export class TreeNodeQuery<S extends Selection<TreeNode> = {}> extends Query<TreeNode, S> {
    getModel() {
        return TreeNode;
    }

    reduce(other: Query<TreeNode>): Query.Reduction<TreeNode> {
        return [new TreeNodeQuery({ selection: {} })];
    }
}
