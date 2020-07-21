import { Query } from "src";
import { TreeNode } from "../model";
import { ModelSelection } from "../../../src/advanced/selection";

// export class TreeNodeQuery<S extends Query.Selection<TreeNode> = {}> extends Query<TreeNode, S> {
export class TreeNodeQuery<S extends ModelSelection<TreeNode> = {}> extends Query<TreeNode, S> {
    getModel() {
        return TreeNode;
    }

    reduce(other: Query<TreeNode>): Query.Reduction<TreeNode> {
        return [new TreeNodeQuery({ selection: {} })];
    }
}
