import { PayloadHydrator, HydratableQueryResult, PayloadHydration, isTypedHydratableQueryResult, TypedInstance, TypedQuery, createAlwaysReducible } from "src";
import { TreeNodeLevelQuery, TreeNodeParentsQuery, TreeNodeQuery, TreeNodeModel, TreeNodeParentsModel } from "../model";

// [todo] no type safety
export class TreeNodePayloadHydrator implements PayloadHydrator {
    hydrate(hydratable: HydratableQueryResult): PayloadHydration[] {
        if (!isTypedHydratableQueryResult(hydratable, TreeNodeQuery)) {
            throw new Error(`hydratable not of expected type`);
        }

        const hydrations: PayloadHydration[] = [];

        if (hydratable.selection.level) {
            const nodeIds = hydratable.payload.map(x => x.id);

            for (const nodeId of nodeIds) {
                const query = new TreeNodeLevelQuery({ selection: {}, criteria: [{ nodeId: [{ op: "in", values: new Set([nodeId]) }] }], options: createAlwaysReducible() });
                const hydration: PayloadHydration = {
                    load: query,
                    assign: (nodes: TypedInstance<TreeNodeModel>[], levels: TypedInstance<TypedQuery.Model<typeof query>>[]) => {
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
                    criteria: [{ childId: [{ op: "in", values: new Set([nodeId]) }] }],
                    options: createAlwaysReducible(),
                });

                const hydration: PayloadHydration = {
                    load: query,
                    assign: (nodes: TypedInstance<TreeNodeModel>[], allParents: TypedInstance<TypedQuery.Model<typeof query>>[]) => {
                        for (const parents of allParents) {
                            const node = nodes.find(x => x.id === parents.childId);

                            if (node !== void 0) {
                                node.parents = parents.parents;
                                node.parentIds = parents.parents.map(x => x.id);
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
