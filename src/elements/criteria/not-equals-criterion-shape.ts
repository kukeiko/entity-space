import { Class, Primitive, primitiveTypeToString } from "@entity-space/utils";
import { CriterionShape } from "./criterion-shape";
import { NotEqualsCriterion } from "./not-equals-criterion";

export class NotEqualsCriterionShape<T extends Primitive = Primitive> extends CriterionShape<NotEqualsCriterion> {
    constructor(valueTypes: T[]) {
        super();
        this.#valueTypes = Object.freeze(valueTypes.slice());
    }

    readonly #valueTypes: readonly T[];
    override readonly type = "not-equals";

    getValueTypes(): readonly T[] {
        return this.#valueTypes;
    }

    override getCriterionType(): Class<NotEqualsCriterion> {
        return NotEqualsCriterion;
    }

    override toString(): string {
        return `!${this.#valueTypes.map(primitiveTypeToString).sort().join(", ")}`;
    }
}
