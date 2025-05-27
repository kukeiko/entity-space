import { Class, Primitive, primitiveTypeToString } from "@entity-space/utils";
import { uniq } from "lodash";
import { CriterionShape } from "./criterion-shape";
import { InArrayCriterion } from "./in-array-criterion";

export class InArrayCriterionShape<T extends Primitive = Primitive> extends CriterionShape<InArrayCriterion> {
    constructor(valueTypes: T[]) {
        super();
        this.#valueTypes = Object.freeze(uniq(valueTypes.slice()));
    }

    readonly #valueTypes: readonly T[];
    override readonly type = "in-array";

    getValueTypes(): readonly T[] {
        return this.#valueTypes;
    }

    override getCriterionType(): Class<InArrayCriterion> {
        return InArrayCriterion;
    }

    override toString(): string {
        return `{ ${this.#valueTypes.map(primitiveTypeToString).sort().join(", ")} }`;
    }
}
