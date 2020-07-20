import { PartialFields } from "src";

export class TreeNodeLevel {
    constructor(args?: PartialFields<TreeNodeLevel>) {
        Object.assign(this, args || {});
    }

    nodeId: number = 0;
    level: number = 0;
}
