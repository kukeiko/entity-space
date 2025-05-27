import { Class, Primitive, primitiveTypeToString } from "@entity-space/utils";
import { CriterionShape } from "./criterion-shape";
import { EqualsCriterion } from "./equals-criterion";

export class EqualsCriterionShape<T extends Primitive = Primitive> extends CriterionShape<EqualsCriterion> {
    constructor(valueTypes: T[]) {
        super();
        this.#valueTypes = Object.freeze(valueTypes.slice());
    }

    readonly #valueTypes: readonly T[];
    override readonly type = "equals";

    getValueTypes(): readonly T[] {
        return this.#valueTypes;
    }

    override getCriterionType(): Class<EqualsCriterion> {
        return EqualsCriterion;
    }

    override toString(): string {
        return `${this.#valueTypes.map(primitiveTypeToString).sort().join(", ")}`;
    }
}
