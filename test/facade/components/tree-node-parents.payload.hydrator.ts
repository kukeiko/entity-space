import { PayloadHydrator, HydratableQueryResult, Query, PayloadHydration, Instance } from "src";
import { TreeNodeParentsModel, TreeNodeModel, TreeNodeQuery } from "../model";
import { TreeNodePayloadHydrator } from "./tree-node.payload-hydrator";

export class TreeNodeParentsHydrator implements PayloadHydrator<TreeNodeParentsModel> {
    constructor(private readonly _treeNodeHydrator: TreeNodePayloadHydrator) {}

    hydrate(hydratable: HydratableQueryResult<TreeNodeParentsModel>): PayloadHydration<TreeNodeParentsModel, Query>[] {
        const hydrations: PayloadHydration<TreeNodeParentsModel, Query>[] = [];

        if (hydratable.selection.parents !== void 0) {
            const allParents = hydratable.payload.reduce((acc, value) => [...acc, ...value.parents], [] as Instance<TreeNodeModel>[]);

            const forwardedHydratable: HydratableQueryResult<TreeNodeModel> = {
                payload: allParents,
                selection: hydratable.selection.parents === true ? {} : hydratable.selection.parents,
                loaded: new TreeNodeQuery({ selection: hydratable.loaded.selection }),
            };

            const treeNodeHydrations = this._treeNodeHydrator.hydrate(forwardedHydratable);

            const forwardedHydrations = treeNodeHydrations.map(x => {
                return {
                    load: x.load,
                    assign: (items: Instance<TreeNodeParentsModel>[], loaded: any[]) => x.assign(this._flattenParents(items), loaded),
                };
            });

            hydrations.push(...forwardedHydrations);
        }

        return hydrations;
    }

    private _flattenParents(items: Instance<TreeNodeParentsModel>[]): Instance<TreeNodeModel>[] {
        return items.reduce((acc, value) => [...acc, ...value.parents], [] as Instance<TreeNodeModel>[]);
    }
}
