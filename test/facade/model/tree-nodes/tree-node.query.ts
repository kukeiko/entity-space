import { Query, Selection } from "src";
import { TreeNodeModel } from "./tree-node.model";

export class TreeNodeQuery<S extends Selection<TreeNodeModel> = {}> extends Query<TreeNodeModel, S> {
    getModel() {
        return TreeNodeModel;
    }

    reduce(other: Query<TreeNodeModel>): Query.Reduction<TreeNodeModel> {
        return [new TreeNodeQuery({ selection: {} })];
    }
}
