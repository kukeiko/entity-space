import { TypedQuery, TypedSelection, Reducible, PartialFields } from "src";
import { TreeNodeModel } from "./tree-node.model";

export class TreeNodeQuery<S extends TypedSelection<TreeNodeModel> = TypedSelection<TreeNodeModel>> extends TypedQuery<TreeNodeModel, S, TreeNodeQuery.Options> {
    model = [TreeNodeModel];
}

export module TreeNodeQuery {
    export class Options implements Reducible {
        constructor(args?: PartialFields<Options>) {
            Object.assign(this, args || {});
        }

        // [todo] change this to e.g. "startNodeId", as we already have a "level" property that tells us how many parents a node has.
        numMinParents?: number;

        reduce(other: this): this | null {
            return other;
        }
    }
}
