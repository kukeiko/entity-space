import { Class, Primitive, primitiveTypeToString } from "@entity-space/utils";
import { uniq } from "lodash";
import { CriterionShape } from "./criterion-shape";
import { NotInArrayCriterion } from "./not-in-array-criterion";

export class NotInArrayCriterionShape<T extends Primitive = Primitive> extends CriterionShape<NotInArrayCriterion> {
    constructor(valueTypes: T[]) {
        super();
        this.#valueTypes = Object.freeze(uniq(valueTypes.slice()));
    }

    readonly #valueTypes: readonly T[];
    override readonly type = "not-in-array";

    getValueTypes(): readonly T[] {
        return this.#valueTypes;
    }

    override getCriterionType(): Class<NotInArrayCriterion> {
        return NotInArrayCriterion;
    }

    override toString(): string {
        return `!{ ${this.#valueTypes.map(primitiveTypeToString).sort().join(", ")} }`;
    }
}
