import { Primitive, primitiveToString } from "@entity-space/utils";
import { Criterion } from "./criterion";

export class NotInArrayCriterion extends Criterion {
    constructor(values: readonly ReturnType<Primitive>[]) {
        super();
        this.#values = Object.freeze(new Set(values.slice().sort()));
    }

    override readonly type = "not-in-array";
    readonly #values: ReadonlySet<ReturnType<Primitive>>;

    getValues(): readonly ReturnType<Primitive>[] {
        return Array.from(this.#values);
    }

    override contains(value: unknown): boolean {
        return !this.#values.has(value as any);
    }

    override toString(): string {
        return `!{ ${this.getValues().map(primitiveToString).join(", ")} }`;
    }
}
