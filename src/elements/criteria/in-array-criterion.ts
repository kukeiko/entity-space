import { Primitive, primitiveToString } from "@entity-space/utils";
import { Criterion } from "./criterion";

export class InArrayCriterion extends Criterion {
    constructor(values: readonly ReturnType<Primitive>[]) {
        super();
        this.#values = Object.freeze(new Set(values.slice().sort()));
    }

    override readonly type = "in-array";
    readonly #values: ReadonlySet<ReturnType<Primitive>>;

    getValues(): readonly ReturnType<Primitive>[] {
        return Array.from(this.#values);
    }

    override contains(value: unknown): boolean {
        // [todo] 🧨 sneaky hack to make filtering on primitive arrays work, should probably introduce new type of criterion instead
        if (Array.isArray(value)) {
            return value.some(candidate => this.#values.has(candidate));
        }

        return this.#values.has(value as any);
    }

    override toString(): string {
        return `{ ${this.getValues().map(primitiveToString).join(", ")} }`;
    }
}
