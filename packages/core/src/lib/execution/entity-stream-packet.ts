import { Entity } from "@entity-space/common";
import { flatMap } from "lodash";
import { EntitySet } from "../entity/data-structures/entity-set";
import { mergeQueries } from "../query/merge-queries.fn";
import { EntityQuery } from "../query/entity-query";
import { subtractQueries } from "../query/subtract-queries.fn";
import { EntityQueryError } from "../query/entity-query-error";

export class EntityStreamPacket<T extends Entity = Entity> {
    constructor({
        accepted,
        rejected,
        errors,
        payload,
    }: {
        accepted?: EntityQuery[];
        rejected?: EntityQuery[];
        errors?: EntityQueryError<T>[];
        payload?: EntitySet<T>[];
    } = {}) {
        this.accepted = accepted ?? [];
        this.rejected = rejected ?? [];
        this.errors = errors ?? [];
        this.payload = payload ?? [];
    }

    private readonly accepted: EntityQuery[];
    private readonly rejected: EntityQuery[];
    private readonly errors: EntityQueryError<T>[];
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

    getErrors(): EntityQueryError<T>[] {
        return this.errors.slice();
    }

    withoutRejected(): EntityStreamPacket<T> {
        return EntityStreamPacket.withoutRejected(this);
    }

    toString(): string {
        const accepted = this.accepted.length == 0 ? "" : "✔️ " + this.accepted.join(",");
        const rejected = this.rejected.length == 0 ? "" : "❌ " + this.rejected.join(",");
        const entities = this.getEntitiesFlat().length == 0 ? "" : "🎁 " + JSON.stringify(this.getEntitiesFlat());

        return [accepted, rejected, entities].filter(str => str.length > 0).join(", ");
    }

    concat(other: EntityStreamPacket<T>): EntityStreamPacket<T> {
        return EntityStreamPacket.concat(this, other);
    }

    merge(other: EntityStreamPacket<T>): EntityStreamPacket<T> {
        return new EntityStreamPacket<T>({
            accepted: mergeQueries(...this.getAcceptedQueries(), ...other.getAcceptedQueries()),
            // [todo] just concatenated, not actually merged
            errors: [...this.getErrors(), ...other.getErrors()],
            // [todo] just concatenated, not actually merged
            payload: [...this.getPayload(), ...other.getPayload()],
            rejected: mergeQueries(...this.getRejectedQueries(), ...other.getRejectedQueries()),
        });
    }

    reduceQueries(queries: EntityQuery[]): false | EntityQuery[] {
        return subtractQueries(queries, [...this.getAcceptedQueries(), ...this.getRejectedQueries()]);
    }

    reduceQueriesByAccepted(queries: EntityQuery[]): false | EntityQuery[] {
        return subtractQueries(queries, this.getAcceptedQueries());
    }

    static isEmpty<T extends Entity>(packet: EntityStreamPacket<T>): boolean {
        return !packet.accepted.length && !packet.errors.length && !packet.payload.length && !packet.rejected.length;
    }

    isEmpty(): boolean {
        return EntityStreamPacket.isEmpty(this);
    }

    static isNotEmpty<T extends Entity>(packet: EntityStreamPacket<T>): boolean {
        return !EntityStreamPacket.isEmpty(packet);
    }

    static containsRejected<T extends Entity>(packet: EntityStreamPacket<T>): boolean {
        return packet.rejected.length > 0;
    }

    static concat<T extends Entity>(a: EntityStreamPacket<T>, b: EntityStreamPacket<T>): EntityStreamPacket<T> {
        return new EntityStreamPacket<T>({
            accepted: [...a.getAcceptedQueries(), ...b.getAcceptedQueries()],
            errors: [...a.getErrors(), ...b.getErrors()],
            payload: [...a.getPayload(), ...b.getPayload()],
            rejected: [...a.getRejectedQueries(), ...b.getRejectedQueries()],
        });
    }

    static withoutRejected<T extends Entity>(packet: EntityStreamPacket<T>): EntityStreamPacket<T> {
        return new EntityStreamPacket<T>({
            accepted: packet.getAcceptedQueries(),
            errors: packet.getErrors(),
            payload: packet.getPayload(),
        });
    }

    static withOnlyRejected<T extends Entity>(packet: EntityStreamPacket<T>): EntityStreamPacket<T> {
        return new EntityStreamPacket<T>({
            rejected: packet.getRejectedQueries(),
        });
    }
}