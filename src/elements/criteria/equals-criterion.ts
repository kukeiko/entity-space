import { Primitive, primitiveToString } from "@entity-space/utils";
import { Criterion } from "./criterion";

export class EqualsCriterion extends Criterion {
    constructor(value: ReturnType<Primitive>) {
        super();
        this.#value = value;
    }

    override readonly type = "equals";
    readonly #value: ReturnType<Primitive>;

    getValue(): ReturnType<Primitive> {
        return this.#value;
    }

    getType(): "equals" {
        return "equals";
    }

    override contains(value: unknown): boolean {
        return this.#value === value;
    }

    override toString(): string {
        return primitiveToString(this.#value);
    }
}
