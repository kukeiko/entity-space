import { PartialFields } from "src";
import { Property } from "../../../src/advanced/property";

export class TreeNodeLevel {
    // constructor(args?: PartialFields<TreeNodeLevel>) {
    //     Object.assign(this, args || {});
    // }

    nodeId = Property.create("nodeId", Number, b => b.loadable());
    level = Property.create("level", Number, b => b.loadable());
}
