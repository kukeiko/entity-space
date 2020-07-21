import { Query, Selection } from "src";
import { TreeNodeLevel } from "../model";

export class TreeNodeLevelQuery<S extends Selection<TreeNodeLevel> = {}> extends Query<TreeNodeLevel, S> {
    getModel() {
        return TreeNodeLevel;
    }
}
