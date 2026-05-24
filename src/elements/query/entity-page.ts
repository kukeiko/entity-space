import { InRangeCriterion } from "../criteria/in-range-criterion";

export class EntityPage {
    constructor(from?: number, to?: number) {
        this.#range = new InRangeCriterion(from, to);
    }

    readonly #range: InRangeCriterion<number>;

    getRange(): InRangeCriterion {
        return this.#range;
    }

    getFrom(): number {
        return this.#range?.getFrom()?.value ?? 0;
    }

    getTo(): number | undefined {
        return this.#range?.getTo()?.value;
    }

    getSkip(): number {
        return this.getFrom();
    }

    getTop(): number | undefined {
        const [from, to] = [this.getFrom(), this.getTo()];

        if (to === undefined) {
            return undefined;
        }

        return to - from;
    }

    toString(): string {
        const parts: string[] = [];
        parts.push(this.getFrom().toString());

        const to = this.#range?.getTo();

        if (to === undefined) {
            parts.push("...");
        } else {
            parts.push(to.value.toString());
        }

        return `${parts.join(", ")}`;
    }
}
