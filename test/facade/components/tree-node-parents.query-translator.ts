import { of } from "rxjs";
import { QueryTranslator, QueryStream, TypedQuery, QueryStreamPacket, TypedCriteria, isTypedQuery, createAlwaysReducible } from "src";
import { TreeNodeParentsModel, TreeNodeParentsQuery } from "../model";
import { TreeNodeRepository } from "../data";

export class TreeNodeParentsQueryTranslator implements QueryTranslator {
    constructor(private readonly _repository: TreeNodeRepository) {}

    translate(query: TreeNodeParentsQuery): QueryStream[] {
        if (!isTypedQuery(query, TreeNodeParentsQuery)) {
            throw new Error(`query to translate not of expected type`);
        }

        const streams: QueryStream[] = [];

        if (query.criteria !== void 0) {
            for (const criteria of query.criteria) {
                if (criteria.childId !== void 0) {
                    for (const idCriterion of criteria.childId) {
                        if (idCriterion.op == "in") {
                            for (const id of idCriterion.values) {
                                if (typeof id === "number") {
                                    streams.push(this._byChildIdStream(id));
                                }
                            }
                        }
                    }
                }
            }
        }

        return streams;
    }

    private _byChildIdStream(childId: number): QueryStream {
        const loadItem = () => this._repository.getTreeNodeParents(childId);
        const criteria: TypedCriteria<TreeNodeParentsModel> = [{ childId: [{ op: "in", values: new Set([childId]) }] }];
        const target = new TreeNodeParentsQuery({ criteria, selection: {}, options: createAlwaysReducible() });

        return {
            target,
            open$() {
                const parents = loadItem();
                const payload: TypedQuery.Payload<TreeNodeParentsQuery> = [];

                const packet: QueryStreamPacket = {
                    loaded: target,
                    payload,
                    failed: [],
                    open: [],
                };

                if (parents !== void 0) {
                    payload.push({ childId, parents });
                }

                return of(packet);
            },
        };
    }
}
