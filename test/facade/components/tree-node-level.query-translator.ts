import { of } from "rxjs";
import { QueryTranslator, QueryStream, TypedQuery, QueryStreamPacket, TypedCriteria, Query, isTypedQuery, createAlwaysReducible } from "src";
import { TreeNodeLevelModel, TreeNodeLevelQuery } from "../model";
import { TreeNodeRepository } from "../data";

export class TreeNodeLevelQueryTranslator implements QueryTranslator {
    constructor(private readonly _repository: TreeNodeRepository) {}

    translate(query: Query): QueryStream[] {
        if (!isTypedQuery(query, [TreeNodeLevelModel])) {
            throw new Error(`query to translate not of expected type`);
        }

        const streams: QueryStream[] = [];

        // [todo] this is atrocious. we need a simpler way for users to inspect filtering criteria
        if (query.criteria !== void 0) {
            for (const criteria of query.criteria) {
                if (criteria.nodeId !== void 0) {
                    for (const idCriterion of criteria.nodeId) {
                        if (idCriterion.op == "in") {
                            for (const id of idCriterion.values) {
                                if (typeof id === "number") {
                                    streams.push(this._byIdStream(id));
                                }
                            }
                        }
                    }
                }
            }
        }

        return streams;
    }

    private _byIdStream(id: number): QueryStream {
        const loadItem = () => this._repository.getLevel(id);
        const criteria: TypedCriteria<TreeNodeLevelModel> = [{ nodeId: [{ op: "in", values: new Set([id]) }] }];
        const target = new TreeNodeLevelQuery({ criteria, selection: {}, options: createAlwaysReducible() });

        return {
            target,
            open$() {
                const item = loadItem();
                const payload: TypedQuery.Payload<TreeNodeLevelQuery> = [];

                const packet: QueryStreamPacket = {
                    loaded: target,
                    payload,
                    failed: [],
                    open: [],
                };

                payload.push({ nodeId: id, level: item });

                return of(packet);
            },
        };
    }
}
