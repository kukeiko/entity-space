import { of } from "rxjs";
import { QueryTranslator, QueryStream, Query, QueryStreamPacket, Criteria } from "src";
import { TreeNodeLevelQuery } from "../queries";
import { TreeNodeRepository } from "../repositories";
import { TreeNodeLevel } from "../model";

export class TreeNodeLevelQueryTranslator implements QueryTranslator<TreeNodeLevelQuery> {
    constructor(private readonly _repository: TreeNodeRepository) {}

    translate(query: TreeNodeLevelQuery): QueryStream<TreeNodeLevelQuery>[] {
        const streams: QueryStream<TreeNodeLevelQuery>[] = [];

        if (query.criteria !== void 0) {
            for (const criteria of query.criteria) {
                if (criteria.nodeId !== void 0) {
                    for (const idCriterion of criteria.nodeId) {
                        if (idCriterion.op == "==" && typeof idCriterion.value === "number") {
                            streams.push(this._byIdStream(idCriterion.value));
                        }
                    }
                }
            }
        }

        return streams;
    }

    private _byIdStream(id: number): QueryStream<TreeNodeLevelQuery> {
        const loadItem = () => this._repository.getLevel(id);
        const criteria: Criteria<TreeNodeLevel> = [{ nodeId: [{ op: "==", value: id }] }];
        const target = new TreeNodeLevelQuery({ criteria, selection: {} });

        return {
            target,
            open$() {
                const item = loadItem();
                const payload: Query.Payload<TreeNodeLevelQuery> = [];

                const packet: QueryStreamPacket<TreeNodeLevelQuery> = {
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
