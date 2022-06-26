import { cloneDeep, flatMap } from "lodash";
import { Entity, QueriedEntities } from "../../entity";
import { Query } from "../query";
import { reduceQueries } from "../reduce-queries.fn";

class QueryError<T extends Entity = Entity> {
    constructor(query: Query<T>, error: unknown) {}
}

export class QueryStreamPacket<T extends Entity = Entity> {
    constructor({
        accepted,
        rejected,
        errors,
        payload,
    }: {
        accepted?: Query<T>[];
        rejected?: Query<T>[];
        errors?: QueryError<T>[];
        payload?: QueriedEntities<T>[];
    } = {}) {
        this.accepted = accepted ?? [];
        this.rejected = rejected ?? [];
        this.errors = errors ?? [];
        // this.payload = payload ?? [];
        // [todo] only temporary cause too lazy to replicate at each IEntitySource_V2
        this.payload = (payload ?? []).map(qe => new QueriedEntities(qe.getQuery(), cloneDeep(qe.getEntities())));
    }

    private readonly accepted: Query<T>[];
    private readonly rejected: Query<T>[];
    private readonly errors: QueryError<T>[];
    private readonly payload: QueriedEntities<T>[];

    getEntitiesFlat(): T[] {
        return flatMap(this.payload, queriedEntities => queriedEntities.getEntities());
    }

    getAcceptedQueries(): Query<T>[] {
        return this.accepted.slice();
    }

    getRejectedQueries(): Query<T>[] {
        return this.rejected.slice();
    }

    getPayload(): QueriedEntities<T>[] {
        return this.payload.slice();
    }

    getErrors(): QueryError<T>[] {
        return this.errors.slice();
    }

    withoutRejected(): QueryStreamPacket<T> {
        return QueryStreamPacket.withoutRejected(this);
    }

    toString(): string {
        const accepted = this.accepted.length == 0 ? "" : "✔️ " + this.accepted.join(",");
        const rejected = this.rejected.length == 0 ? "" : "❌ " + this.rejected.join(",");
        const entities = this.getEntitiesFlat().length == 0 ? "" : "📦 " + JSON.stringify(this.getEntitiesFlat());

        return [accepted, rejected, entities].filter(str => str.length > 0).join(", ");
    }

    merge(other: QueryStreamPacket<T>): QueryStreamPacket<T> {
        return QueryStreamPacket.merge(this, other);
    }

    reduceQueries(queries: Query<T>[]): false | Query<T>[] {
        return reduceQueries(queries, [...this.getAcceptedQueries(), ...this.getRejectedQueries()]);
    }

    reduceQueriesByAccepted(queries: Query<T>[]): false | Query<T>[] {
        return reduceQueries(queries, this.getAcceptedQueries());
    }

    static isEmpty<T>(packet: QueryStreamPacket<T>): boolean {
        return !packet.accepted.length && !packet.errors.length && !packet.payload.length && !packet.rejected.length;
    }

    static isNotEmpty<T>(packet: QueryStreamPacket<T>): boolean {
        return !QueryStreamPacket.isEmpty(packet);
    }

    static merge<T>(a: QueryStreamPacket<T>, b: QueryStreamPacket<T>): QueryStreamPacket<T> {
        return new QueryStreamPacket<T>({
            accepted: [...a.getAcceptedQueries(), ...b.getAcceptedQueries()],
            errors: [...a.getErrors(), ...b.getErrors()],
            payload: [...a.getPayload(), ...b.getPayload()],
            rejected: [...a.getRejectedQueries(), ...b.getRejectedQueries()],
        });
    }

    static withoutRejected<T>(packet: QueryStreamPacket<T>): QueryStreamPacket<T> {
        return new QueryStreamPacket<T>({
            accepted: packet.getAcceptedQueries(),
            errors: packet.getErrors(),
            payload: packet.getPayload(),
        });
    }
}
