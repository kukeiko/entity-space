import { of } from "rxjs";
import { QueryTranslator, QueryStream, TypedQuery, QueryStreamPacket, TypedCriteria, createAlwaysReducible } from "src";
import { TreeNodeModel, TreeNodeQuery } from "../model";
import { TreeNodeRepository } from "../data";

export class TreeNodeQueryTranslator implements QueryTranslator {
    constructor(private readonly _repository: TreeNodeRepository) {}

    translate(query: TreeNodeQuery): QueryStream[] {
        const streams: QueryStream[] = [];
        let numMinParents = 0;

        if (query.options.numMinParents !== void 0) {
            numMinParents = query.options.numMinParents;
        }

        if (query.criteria !== void 0) {
            for (const criteria of query.criteria) {
                if (criteria.id !== void 0) {
                    for (const idCriterion of criteria.id) {
                        if (idCriterion.op == "in") {
                            for (const id of idCriterion.values) {
                                if (typeof id === "number") {
                                    streams.push(this._byIdStream(id, numMinParents));
                                }
                            }
                        }
                    }
                }
            }
        }

        return streams;
    }

    private _byIdStream(id: number, numMinParents = 0): QueryStream {
        const loadItem = () => this._repository.get(id, numMinParents);
        const criteria: TypedCriteria<TreeNodeModel> = [{ id: [{ op: "in", values: new Set([id]) }] }];
        const target = new TreeNodeQuery({ criteria, selection: {}, options: createAlwaysReducible() });

        return {
            target,
            open$() {
                const item = loadItem();
                const payload: TypedQuery.Payload<TreeNodeQuery> = [];

                const packet: QueryStreamPacket = {
                    loaded: target,
                    payload,
                    failed: [],
                    open: [],
                };

                if (item !== void 0) {
                    payload.push(item);
                }

                return of(packet);
            },
        };
    }
}
