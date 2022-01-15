import { define } from "@entity-space/core";

export class TreeNodeLevelModel {
    nodeId = define(Number, { id: true, required: true });
    level = define(Number);
}
