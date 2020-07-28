import { of } from "rxjs";
import { QueryTranslator, QueryStream, QueryStreamPacket } from "src";
import { ShapeQuery } from "../model";
import { ShapeRepository } from "../data";

export class ShapeQueryTranslator implements QueryTranslator {
    constructor(private readonly _repository: ShapeRepository) {}

    translate(query: ShapeQuery): QueryStream[] {
        const streams: QueryStream[] = [];

        if (query.criteria.length === 0) {
            return [this._loadAllStream()];
        }

        for (const criterion of query.criteria) {
        }

        return streams;
    }

    private _loadAllStream(): QueryStream {
        const target = new ShapeQuery({ selection: {} });
        const loadItems = () => this._repository.all();

        return {
            target,
            open$() {
                const items = loadItems();

                const packet: QueryStreamPacket = {
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
