import { PayloadHydrator, HydratableQueryResult, Query, PayloadHydration } from "src";
import { TreeNodeModel, TreeNodeLevelQuery, TreeNodeParentsQuery } from "../model";

export class TreeNodePayloadHydrator implements PayloadHydrator<TreeNodeModel> {
    hydrate(hydratable: HydratableQueryResult<TreeNodeModel>): PayloadHydration<TreeNodeModel, Query>[] {
        const hydrations: PayloadHydration<TreeNodeModel, Query>[] = [];

        if (hydratable.selection.level) {
            const nodeIds = hydratable.payload.map(x => x.id);

            for (const nodeId of nodeIds) {
                const query = new TreeNodeLevelQuery({ selection: {}, criteria: [{ nodeId: [{ op: "==", value: nodeId }] }] });
                const hydration: PayloadHydration<TreeNodeModel, typeof query> = {
                    load: query,
                    assign: (nodes, levels) => {
                        for (const level of levels) {
                            const node = nodes.find(x => x.id === level.nodeId);

                            if (node !== void 0) {
                                node.level = level.level;
                            }
                        }
                    },
                };

                hydrations.push(hydration);
            }
        }

        if (hydratable.selection.parents) {
            const nodeIds = hydratable.payload.map(x => x.id);

            for (const nodeId of nodeIds) {
                const query = new TreeNodeParentsQuery({
                    selection: { ...(hydratable.selection.parents === true ? {} : { parents: hydratable.selection.parents }) },
                    criteria: [{ childId: [{ op: "==", value: nodeId }] }],
                });

                const hydration: PayloadHydration<TreeNodeModel, typeof query> = {
                    load: query,
                    assign: (nodes, allParents) => {
                        for (const parents of allParents) {
                            const node = nodes.find(x => x.id === parents.childId);

                            if (node !== void 0) {
                                node.parents = parents.parents;
                            }
                        }
                    },
                };

                hydrations.push(hydration);
            }
        }

        return hydrations;
    }
}
