import { TypedQuery, TypedSelection } from "src";
import { TreeNodeModel } from "./tree-node.model";

export class TreeNodeQuery<S extends TypedSelection<TreeNodeModel> = TypedSelection<TreeNodeModel>> extends TypedQuery<TreeNodeModel, S> {
    getModel() {
        return [TreeNodeModel];
    }

    reduce(other: TypedQuery<TreeNodeModel>): TypedQuery.Reduction<TreeNodeModel> {
        return [new TreeNodeQuery({ selection: {} })];
    }

    model = [TreeNodeModel];
}
