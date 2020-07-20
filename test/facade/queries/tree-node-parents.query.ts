import { Query } from "src";
import { TreeNodeParents } from "../model";

export class TreeNodeParentsQuery extends Query<TreeNodeParents> {
    getModel() {
        return TreeNodeParents;
    }
}
