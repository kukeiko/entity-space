import { getCriterionShapeUniqueCount } from "../criteria/functions/get-criterion-shape-unique-count.fn";
import { EntityQueryShape } from "./entity-query-shape";

export class ReshapedEntityQueryShape {
    constructor(
        reshaped: EntityQueryShape,
        openForCriteria?: EntityQueryShape,
        openForSelection?: EntityQueryShape,
        criteriaFlattenCount = 0,
    ) {
        this.#reshaped = reshaped;
        this.#openForCriteria = openForCriteria;
        this.#openForSelection = openForSelection;
        this.#criteriaFlattenCount = criteriaFlattenCount;
    }

    readonly #reshaped: EntityQueryShape;
    readonly #openForCriteria?: EntityQueryShape;
    readonly #openForSelection?: EntityQueryShape;
    readonly #criteriaFlattenCount: number;

    getReshaped(): EntityQueryShape {
        return this.#reshaped;
    }

    getOpenForCriteria(): EntityQueryShape | undefined {
        return this.#openForCriteria;
    }

    getOpenForSelection(): EntityQueryShape | undefined {
        return this.#openForSelection;
    }

    getCriteriaFlattenCount(): number {
        return this.#criteriaFlattenCount;
    }

    getCriteriaUniqueCount(): number {
        const criterionShape = this.#reshaped.getCriterionShape();

        if (!criterionShape) {
            return 0;
        }

        return getCriterionShapeUniqueCount(this.#reshaped.getSchema(), criterionShape);
    }
}
