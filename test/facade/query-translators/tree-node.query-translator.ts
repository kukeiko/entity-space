import { of } from "rxjs";
import { QueryTranslator, QueryStream, Query, QueryStreamPacket, Criteria } from "src";
import { TreeNodeQuery } from "../queries";
import { TreeNodeRepository } from "../repositories";
import { TreeNode } from "../model";

export class TreeNodeQueryTranslator implements QueryTranslator<TreeNodeQuery> {
    constructor(private readonly _repository: TreeNodeRepository) {}

    translate(query: TreeNodeQuery): QueryStream<TreeNodeQuery>[] {
        const streams: QueryStream<TreeNodeQuery>[] = [];

        if (query.criteria !== void 0) {
            for (const criteria of query.criteria) {
                if (criteria.id !== void 0) {
                    for (const idCriterion of criteria.id) {
                        if (idCriterion.op == "==" && typeof idCriterion.value === "number") {
                            streams.push(this._byIdStream(idCriterion.value));
                        }
                    }
                }
            }
        }

        return streams;
    }

    private _byIdStream(id: number): QueryStream<TreeNodeQuery> {
        const loadItem = () => this._repository.get(id);
        const criteria: Criteria<TreeNode> = [{ id: [{ op: "==", value: id }] }];
        const target = new TreeNodeQuery({ criteria, selection: {} });

        return {
            target,
            open$() {
                const item = loadItem();
                const payload: Query.Payload<TreeNodeQuery> = [];

                const packet: QueryStreamPacket<TreeNodeQuery> = {
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
