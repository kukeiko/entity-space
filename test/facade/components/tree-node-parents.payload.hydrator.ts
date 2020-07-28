import { PayloadHydrator, HydratableQueryResult, PayloadHydration, TypedInstance, isTypedHydratableQueryResult, Instance } from "src";
import { TreeNodeModel, TreeNodeQuery, TreeNodeParentsQuery } from "../model";
import { TreeNodePayloadHydrator } from "./tree-node.payload-hydrator";

export class TreeNodeParentsHydrator implements PayloadHydrator {
    constructor(private readonly _treeNodeHydrator: TreeNodePayloadHydrator) {}

    hydrate(hydratable: HydratableQueryResult): PayloadHydration[] {
        if (!isTypedHydratableQueryResult(hydratable, TreeNodeParentsQuery)) {
            throw new Error(`hydratable not of expected type`);
        }

        const hydrations: PayloadHydration[] = [];

        if (hydratable.selection.parents !== void 0) {
            const allParents = hydratable.payload.reduce((acc, value) => [...acc, ...value.parents], [] as TypedInstance<TreeNodeModel>[]);

            const forwardedHydratable: HydratableQueryResult = {
                payload: allParents,
                selection: hydratable.selection.parents === true ? {} : hydratable.selection.parents,
                loaded: new TreeNodeQuery({ selection: hydratable.loaded.selection }),
            };

            const treeNodeHydrations = this._treeNodeHydrator.hydrate(forwardedHydratable);

            const forwardedHydrations = treeNodeHydrations.map(x => {
                return {
                    load: x.load,
                    assign: (items: TypedInstance<TreeNodeModel>[], loaded: Instance[]) => x.assign(this._flattenParents(items), loaded),
                };
            });

            hydrations.push(...forwardedHydrations);
        }

        return hydrations;
    }

    private _flattenParents(items: TypedInstance<TreeNodeModel>[]): TypedInstance<TreeNodeModel>[] {
        return items.reduce((acc, value) => [...acc, ...value.parents], [] as TypedInstance<TreeNodeModel>[]);
    }
}
