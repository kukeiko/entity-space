import { Entity } from "../common/entity.type";
import { EntityCriteriaTools } from "../criteria/entity-criteria-tools";
import { EntitySet } from "../entity/entity-set";
import { EntityQueryError } from "../query/entity-query-error";
import { EntityQueryTools } from "../query/entity-query-tools";
import { IEntityQueryTools } from "../query/entity-query-tools.interface";
import { IEntityQuery } from "../query/entity-query.interface";

export class EntityStreamPacket<T extends Entity = Entity> {
    constructor({
        accepted,
        delivered,
        rejected,
        errors,
        payload,
    }: {
        accepted?: IEntityQuery[];
        delivered?: IEntityQuery[];
        rejected?: IEntityQuery[];
        errors?: EntityQueryError<T>[];
        payload?: EntitySet<T>[];
    } = {}) {
        this.accepted = accepted ?? [];
        this.delivered = delivered ?? [];
        this.rejected = rejected ?? [];
        this.errors = errors ?? [];
        this.payload = payload ?? [];
    }

    private readonly queryTools: IEntityQueryTools = new EntityQueryTools({ criteriaTools: new EntityCriteriaTools() });
    private readonly accepted: IEntityQuery[];
    private readonly delivered: IEntityQuery[];
    private readonly rejected: IEntityQuery[];
    private readonly errors: EntityQueryError<T>[];
    private readonly payload: EntitySet<T>[];

    getEntitiesFlat(): T[] {
        return this.payload.flatMap(payload => payload.getEntities());
    }

    getAcceptedQueries(): IEntityQuery[] {
        return this.accepted.slice();
    }

    getDeliveredQueries(): IEntityQuery[] {
        return this.delivered.slice();
    }

    getRejectedQueries(): IEntityQuery[] {
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
        const delivered = this.delivered.length ? "🚚 " + this.delivered.join(",") : "";
        const entities = this.getEntitiesFlat().length == 0 ? "" : "🎁 " + JSON.stringify(this.getEntitiesFlat());

        return `📦 ${[accepted, delivered, rejected, entities].filter(str => str.length > 0).join(", ")}`;
    }

    merge(other: EntityStreamPacket<T>): EntityStreamPacket<T> {
        return new EntityStreamPacket<T>({
            accepted: this.queryTools.mergeQueries(...this.accepted, ...other.accepted),
            delivered: this.queryTools.mergeQueries(...this.delivered, ...other.delivered),
            // [todo] just concatenated, not actually merged
            errors: [...this.errors, ...other.errors],
            // [todo] just concatenated, not actually merged
            payload: [...this.payload, ...other.payload],
            rejected: this.queryTools.mergeQueries(...this.rejected, ...other.rejected),
        });
    }

    subtractQueries(queries: IEntityQuery[]): false | IEntityQuery[] {
        return this.queryTools.subtractQueries(queries, [...this.getAcceptedQueries(), ...this.getRejectedQueries()]);
    }

    subtractQueriesByAccepted(queries: IEntityQuery[]): false | IEntityQuery[] {
        return this.queryTools.subtractQueries(queries, this.getAcceptedQueries());
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

    static hasRejected<T extends Entity>(packet: EntityStreamPacket<T>): boolean {
        return packet.hasRejected();
    }

    hasRejected(): boolean {
        return this.rejected.length > 0;
    }

    hasDelivered(): boolean {
        return this.delivered.length > 0;
    }

    hasPayload(): boolean {
        return this.payload.length > 0;
    }

    static withoutRejected<T extends Entity>(packet: EntityStreamPacket<T>): EntityStreamPacket<T> {
        return new EntityStreamPacket<T>({
            accepted: packet.getAcceptedQueries(),
            delivered: packet.getDeliveredQueries(),
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
