import { Observable } from "rxjs";
import { Entity, QueriedEntities } from "../../entity";
import { IEntitySource_V2 } from "./i-entity-source-v2";
import { QueryStreamPacket } from "./query-stream-packet";

export interface IEntityHydrator {
    hydrate<T extends Entity = Entity>(
        queriedEntities: QueriedEntities<T>[],
        source: IEntitySource_V2
    ): Observable<QueryStreamPacket<T>>;
}
