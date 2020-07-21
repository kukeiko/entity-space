import { of } from "rxjs";
import { QueryTranslator, QueryStream, Query, QueryStreamPacket } from "src";
import { TreeNodeParentsQuery } from "../queries";
import { TreeNodeRepository } from "../repositories";
import { TreeNodeParents } from "../model";
import { EntityCriteria } from "../../../src/advanced/entity-criteria";

export class TreeNodeParentsQueryTranslator implements QueryTranslator<TreeNodeParentsQuery> {
    constructor(private readonly _repository: TreeNodeRepository) {}

    translate(query: TreeNodeParentsQuery): QueryStream<TreeNodeParentsQuery>[] {
        const streams: QueryStream<TreeNodeParentsQuery>[] = [];

        if (query.criteria !== void 0) {
            for (const criteria of query.criteria) {
                if (criteria.childId !== void 0) {
                    for (const idCriterion of criteria.childId) {
                        if (idCriterion.op == "==" && typeof idCriterion.value === "number") {
                            streams.push(this._byChildIdStream(idCriterion.value));
                        }
                    }
                }
            }
        }

        return streams;
    }

    private _byChildIdStream(childId: number): QueryStream<TreeNodeParentsQuery> {
        const loadItem = () => this._repository.getTreeNodeParents(childId);
        const criteria: EntityCriteria<TreeNodeParents> = [{ childId: [{ op: "==", value: childId }] }];
        const target = new TreeNodeParentsQuery({ criteria, selection: {} });

        return {
            target,
            open$() {
                const parents = loadItem();
                const payload: Query.Payload<TreeNodeParentsQuery> = [];

                const packet: QueryStreamPacket<TreeNodeParentsQuery> = {
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
