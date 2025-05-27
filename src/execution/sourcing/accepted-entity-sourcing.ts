import { Entity, EntityQuery, ReshapedEntityQueryShape } from "@entity-space/elements";
import { EntityQueryExecutionContext } from "../entity-query-execution-context";
import { EntitySource } from "./entity-source";

export type SourceEntitiesFunction = (query: EntityQuery, context: EntityQueryExecutionContext) => Promise<Entity[]>;

export class AcceptedEntitySourcing {
    constructor(
        source: EntitySource,
        reshapedShape: ReshapedEntityQueryShape,
        sourceEntitiesFn: SourceEntitiesFunction,
    ) {
        this.#source = source;
        this.#reshapedShape = reshapedShape;
        this.#sourceEntitiesFn = sourceEntitiesFn;
    }

    readonly #source: EntitySource;
    readonly #reshapedShape: ReshapedEntityQueryShape;
    readonly #sourceEntitiesFn: SourceEntitiesFunction;

    getSource(): EntitySource {
        return this.#source;
    }

    getReshapedShape(): ReshapedEntityQueryShape {
        return this.#reshapedShape;
    }

    sourceEntities(query: EntityQuery, context: EntityQueryExecutionContext): Promise<Entity[]> {
        return this.#sourceEntitiesFn(query, context);
    }
}
