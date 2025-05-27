import { EntityQueryShape } from "./entity-query-shape";

export class ReshapedEntityQueryShape {
    constructor(reshaped: EntityQueryShape, openForCriteria?: EntityQueryShape, openForSelection?: EntityQueryShape) {
        this.#reshaped = reshaped;
        this.#openForCriteria = openForCriteria;
        this.#openForSelection = openForSelection;
    }

    readonly #reshaped: EntityQueryShape;
    readonly #openForCriteria?: EntityQueryShape;
    readonly #openForSelection?: EntityQueryShape;

    getReshaped(): EntityQueryShape {
        return this.#reshaped;
    }

    getOpenForCriteria(): EntityQueryShape | undefined {
        return this.#openForCriteria;
    }

    getOpenForSelection(): EntityQueryShape | undefined {
        return this.#openForSelection;
    }
}
