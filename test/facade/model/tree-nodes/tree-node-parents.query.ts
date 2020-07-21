import { Query } from "src";
import { TreeNodeParentsModel } from "./tree-node-parents.model";

export class TreeNodeParentsQuery extends Query<TreeNodeParentsModel> {
    getModel() {
        return TreeNodeParentsModel;
    }
}
