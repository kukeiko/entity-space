import { Query } from "src";
import { TreeNodeLevel } from "../model";

export class TreeNodeLevelQuery<S extends Query.Selection<TreeNodeLevel> = {}> extends Query<TreeNodeLevel, S> {
    getModel() {
        return TreeNodeLevel;
    }
}
