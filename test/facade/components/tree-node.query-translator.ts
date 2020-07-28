import { of } from "rxjs";
import { QueryTranslator, QueryStream, TypedQuery, QueryStreamPacket, TypedCriteria } from "src";
import { TreeNodeModel, TreeNodeQuery } from "../model";
import { TreeNodeRepository } from "../data";

export class TreeNodeQueryTranslator implements QueryTranslator {
    constructor(private readonly _repository: TreeNodeRepository) {}

    translate(query: TreeNodeQuery): QueryStream[] {
        const streams: QueryStream[] = [];

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

    private _byIdStream(id: number): QueryStream {
        const loadItem = () => this._repository.get(id);
        const criteria: TypedCriteria<TreeNodeModel> = [{ id: [{ op: "==", value: id }] }];
        const target = new TreeNodeQuery({ criteria, selection: {} });

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
