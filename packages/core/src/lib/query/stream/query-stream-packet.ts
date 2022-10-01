import { flatMap } from "lodash";
import { Entity, EntitySet } from "../../entity";
import { mergeQueries } from "../merge-queries.fn";
import { Query } from "../query";
import { reduceQueries } from "../reduce-queries.fn";

class QueryError<T extends Entity = Entity> {
    constructor(query: Query, error: unknown) {}
}

export class QueryStreamPacket<T extends Entity = Entity> {
    constructor({
        accepted,
        delivered,
        rejected,
        errors,
        payload,
    }: {
        accepted?: Query[];
        delivered?: Query[];
        rejected?: Query[];
        errors?: QueryError<T>[];
        payload?: EntitySet<T>[];
    } = {}) {
        this.accepted = accepted ?? [];
        this.delivered = delivered ?? [];
        this.rejected = rejected ?? [];
        this.errors = errors ?? [];
        this.payload = payload ?? [];
    }

    private readonly accepted: Query[];
    private readonly delivered: Query[];
    private readonly rejected: Query[];
    private readonly errors: QueryError<T>[];
    private readonly payload: EntitySet<T>[];

    getEntitiesFlat(): T[] {
        return flatMap(this.payload, queriedEntities => queriedEntities.getEntities());
    }

    getAcceptedQueries(): Query[] {
        return this.accepted.slice();
    }

    // [todo] make use of this
    getDeliveredQueries(): Query[] {
        return this.delivered.slice();
    }

    getRejectedQueries(): Query[] {
        return this.rejected.slice();
    }

    getPayload(): EntitySet<T>[] {
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

    concat(other: QueryStreamPacket<T>): QueryStreamPacket<T> {
        return QueryStreamPacket.concat(this, other);
    }

    merge(other: QueryStreamPacket<T>): QueryStreamPacket<T> {
        return new QueryStreamPacket<T>({
            accepted: mergeQueries(...this.getAcceptedQueries(), ...other.getAcceptedQueries()),
            // [todo] just concatenated, not actually merged
            errors: [...this.getErrors(), ...other.getErrors()],
            // [todo] just concatenated, not actually merged
            payload: [...this.getPayload(), ...other.getPayload()],
            rejected: mergeQueries(...this.getRejectedQueries(), ...other.getRejectedQueries()),
        });
    }

    reduceQueries(queries: Query[]): false | Query[] {
        return reduceQueries(queries, [...this.getAcceptedQueries(), ...this.getRejectedQueries()]);
    }

    reduceQueriesByAccepted(queries: Query[]): false | Query[] {
        return reduceQueries(queries, this.getAcceptedQueries());
    }

    static isEmpty<T>(packet: QueryStreamPacket<T>): boolean {
        return !packet.accepted.length && !packet.errors.length && !packet.payload.length && !packet.rejected.length;
    }

    isEmpty(): boolean {
        return QueryStreamPacket.isEmpty(this);
    }

    static isNotEmpty<T>(packet: QueryStreamPacket<T>): boolean {
        return !QueryStreamPacket.isEmpty(packet);
    }

    static concat<T>(a: QueryStreamPacket<T>, b: QueryStreamPacket<T>): QueryStreamPacket<T> {
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
