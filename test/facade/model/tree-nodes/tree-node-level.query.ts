import { Query, Selection } from "src";
import { TreeNodeLevelModel } from "./tree-node-level.model";

export class TreeNodeLevelQuery<S extends Selection<TreeNodeLevelModel> = Selection<TreeNodeLevelModel>> extends Query<TreeNodeLevelModel, S> {
    getModel() {
        return [TreeNodeLevelModel];
    }
}
