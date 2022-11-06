import { Entity } from "@entity-space/common";
import { flatMap } from "lodash";
import { EntitySet } from "../entity/data-structures/entity-set";
import { mergeQueries_v2 } from "../query/merge-queries-v2.fn";
import { EntityQuery } from "../query/query";
import { reduceQueries } from "../query/reduce-queries.fn";

function hasProperty<T extends string>(value: unknown, key: T): value is typeof value & Record<T, unknown> {
    return (value ?? ({} as any))[key] !== void 0;
}

// [todo] not used / implemented
export class QueryError<T extends Entity = Entity> {
    constructor(query: EntityQuery, public error: unknown) {}

    getErrorMessage(): string {
        if (hasProperty(this.error, "message")) {
            if (typeof this.error.message === "string") {
                return this.error.message;
            } else {
                return JSON.stringify(this.error.message);
            }
        }

        return JSON.stringify(this.error);
    }
}

export class QueryStreamPacket<T extends Entity = Entity> {
    constructor({
        accepted,
        rejected,
        errors,
        payload,
    }: {
        accepted?: EntityQuery[];
        rejected?: EntityQuery[];
        errors?: QueryError<T>[];
        payload?: EntitySet<T>[];
    } = {}) {
        this.accepted = accepted ?? [];
        this.rejected = rejected ?? [];
        this.errors = errors ?? [];
        this.payload = payload ?? [];
    }

    private readonly accepted: EntityQuery[];
    private readonly rejected: EntityQuery[];
    private readonly errors: QueryError<T>[];
    private readonly payload: EntitySet<T>[];

    getEntitiesFlat(): T[] {
        return flatMap(this.payload, queriedEntities => queriedEntities.getEntities());
    }

    getAcceptedQueries(): EntityQuery[] {
        return this.accepted.slice();
    }

    // [todo] not (yet?) used
    getDeliveredQueries(): EntityQuery[] {
        return this.payload.map(payload => payload.getQuery());
    }

    getRejectedQueries(): EntityQuery[] {
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
        const entities = this.getEntitiesFlat().length == 0 ? "" : "🎁 " + JSON.stringify(this.getEntitiesFlat());

        return [accepted, rejected, entities].filter(str => str.length > 0).join(", ");
    }

    concat(other: QueryStreamPacket<T>): QueryStreamPacket<T> {
        return QueryStreamPacket.concat(this, other);
    }

    merge(other: QueryStreamPacket<T>): QueryStreamPacket<T> {
        return new QueryStreamPacket<T>({
            accepted: mergeQueries_v2(...this.getAcceptedQueries(), ...other.getAcceptedQueries()),
            // [todo] just concatenated, not actually merged
            errors: [...this.getErrors(), ...other.getErrors()],
            // [todo] just concatenated, not actually merged
            payload: [...this.getPayload(), ...other.getPayload()],
            rejected: mergeQueries_v2(...this.getRejectedQueries(), ...other.getRejectedQueries()),
        });
    }

    reduceQueries(queries: EntityQuery[]): false | EntityQuery[] {
        return reduceQueries(queries, [...this.getAcceptedQueries(), ...this.getRejectedQueries()]);
    }

    reduceQueriesByAccepted(queries: EntityQuery[]): false | EntityQuery[] {
        return reduceQueries(queries, this.getAcceptedQueries());
    }

    static isEmpty<T extends Entity>(packet: QueryStreamPacket<T>): boolean {
        return !packet.accepted.length && !packet.errors.length && !packet.payload.length && !packet.rejected.length;
    }

    isEmpty(): boolean {
        return QueryStreamPacket.isEmpty(this);
    }

    static isNotEmpty<T extends Entity>(packet: QueryStreamPacket<T>): boolean {
        return !QueryStreamPacket.isEmpty(packet);
    }

    static containsRejected<T extends Entity>(packet: QueryStreamPacket<T>): boolean {
        return packet.rejected.length > 0;
    }

    static concat<T extends Entity>(a: QueryStreamPacket<T>, b: QueryStreamPacket<T>): QueryStreamPacket<T> {
        return new QueryStreamPacket<T>({
            accepted: [...a.getAcceptedQueries(), ...b.getAcceptedQueries()],
            errors: [...a.getErrors(), ...b.getErrors()],
            payload: [...a.getPayload(), ...b.getPayload()],
            rejected: [...a.getRejectedQueries(), ...b.getRejectedQueries()],
        });
    }

    static withoutRejected<T extends Entity>(packet: QueryStreamPacket<T>): QueryStreamPacket<T> {
        return new QueryStreamPacket<T>({
            accepted: packet.getAcceptedQueries(),
            errors: packet.getErrors(),
            payload: packet.getPayload(),
        });
    }

    static withOnlyRejected<T extends Entity>(packet: QueryStreamPacket<T>): QueryStreamPacket<T> {
        return new QueryStreamPacket<T>({
            rejected: packet.getRejectedQueries(),
        });
    }
}
