import { createProperty } from "src";

export class TreeNodeLevel {
    nodeId = createProperty("nodeId", Number, b => b.loadable());
    level = createProperty("level", Number, b => b.loadable());
}
