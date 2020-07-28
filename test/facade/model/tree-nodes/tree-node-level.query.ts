import { TypedQuery, TypedSelection } from "src";
import { TreeNodeLevelModel } from "./tree-node-level.model";

export class TreeNodeLevelQuery<S extends TypedSelection<TreeNodeLevelModel> = TypedSelection<TreeNodeLevelModel>> extends TypedQuery<TreeNodeLevelModel, S> {
    model = [TreeNodeLevelModel];
}
