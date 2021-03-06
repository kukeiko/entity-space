import { TypedQuery } from "src";
import { TreeNodeParentsModel } from "./tree-node-parents.model";

export class TreeNodeParentsQuery extends TypedQuery<TreeNodeParentsModel> {
    model = [TreeNodeParentsModel];
}
