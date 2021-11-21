import { define } from "src";

export class TreeNodeLevelModel {
    nodeId = define(Number, { id: true, required: true });
    level = define(Number);
}
