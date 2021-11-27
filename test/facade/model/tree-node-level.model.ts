import { define } from "@entity-space/model";

export class TreeNodeLevelModel {
    nodeId = define(Number, { id: true, required: true });
    level = define(Number);
}
