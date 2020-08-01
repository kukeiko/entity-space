import { createProperty } from "src";

export class TreeNodeLevelModel {
    nodeId = createProperty("nodeId", [Number], b => b.loadable().identifier());
    level = createProperty("level", [Number], b => b.loadable());
}
