import { of } from "rxjs";
import { QueryTranslator, QueryStream, QueryStreamPacket } from "src";
import { ShapeQuery } from "../model";
import { ShapeRepository } from "../data";

export class ShapeQueryTranslator implements QueryTranslator<ShapeQuery> {
    constructor(private readonly _repository: ShapeRepository) {}

    translate(query: ShapeQuery): QueryStream<ShapeQuery>[] {
        const streams: QueryStream<ShapeQuery>[] = [];

        if (query.criteria.length === 0) {
            return [this._loadAllStream()];
        }

        for (const criterion of query.criteria) {
        }

        return streams;
    }

    private _loadAllStream(): QueryStream<ShapeQuery> {
        const target = new ShapeQuery({ selection: {} });
        const loadItems = () => this._repository.all();

        return {
            target,
            open$() {
                const items = loadItems();

                const packet: QueryStreamPacket<ShapeQuery> = {
                    loaded: target,
                    payload: items,
                    failed: [],
                    open: [],
                };

                return of(packet);
            },
        };
    }
}
