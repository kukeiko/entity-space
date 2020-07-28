import { TypedQuery, TypedSelection } from "src";
import { TreeNodeModel } from "./tree-node.model";

export class TreeNodeQuery<S extends TypedSelection<TreeNodeModel> = TypedSelection<TreeNodeModel>> extends TypedQuery<TreeNodeModel, S> {
    model = [TreeNodeModel];
}
