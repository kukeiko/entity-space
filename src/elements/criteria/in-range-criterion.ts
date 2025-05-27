import { Primitive, primitiveToType } from "@entity-space/utils";
import { isBoolean, uniq } from "lodash";
import { Criterion } from "./criterion";

export interface InRangeCriterionLimit<T> {
    inclusive: boolean;
    value: T;
}

function isFromBiggerThanFrom<T>(from?: InRangeCriterionLimit<T>, biggerThanFrom?: InRangeCriterionLimit<T>): boolean {
    if (from === undefined) {
        return false;
    } else if (biggerThanFrom === undefined) {
        return true;
    } else if (from.inclusive && !biggerThanFrom.inclusive) {
        return from.value > biggerThanFrom.value;
    } else {
        return from.value >= biggerThanFrom.value;
    }
}

function isFromSmallerThanTo<T>(from?: InRangeCriterionLimit<T>, smallerThanTo?: InRangeCriterionLimit<T>): boolean {
    if (smallerThanTo === undefined || from === undefined) {
        return true;
    } else if (from.inclusive && smallerThanTo.inclusive) {
        return from.value <= smallerThanTo.value;
    } else {
        return from.value < smallerThanTo.value;
    }
}

export function isFromInsideFromTo<T>(
    from?: InRangeCriterionLimit<T>,
    insideFrom?: InRangeCriterionLimit<T>,
    insideTo?: InRangeCriterionLimit<T>,
): boolean {
    return isFromBiggerThanFrom(from, insideFrom) && isFromSmallerThanTo(from, insideTo);
}

function isToBiggerThanFrom<T>(to?: InRangeCriterionLimit<T>, biggerThanFrom?: InRangeCriterionLimit<T>): boolean {
    if (biggerThanFrom === undefined || to === undefined) {
        return true;
    } else if (to.inclusive && biggerThanFrom.inclusive) {
        return to.value >= biggerThanFrom.value;
    } else {
        return to.value > biggerThanFrom.value;
    }
}

function isToSmallerThanTo<T>(to?: InRangeCriterionLimit<T>, smallerThanTo?: InRangeCriterionLimit<T>): boolean {
    if (to === undefined) {
        return false;
    } else if (smallerThanTo === undefined) {
        return true;
    } else if (to.inclusive && !smallerThanTo.inclusive) {
        return to.value < smallerThanTo.value;
    } else {
        return to.value <= smallerThanTo.value;
    }
}

export function isToInsideFromTo<T>(
    to?: InRangeCriterionLimit<T>,
    insideFrom?: InRangeCriterionLimit<T>,
    insideTo?: InRangeCriterionLimit<T>,
): boolean {
    return isToBiggerThanFrom(to, insideFrom) && isToSmallerThanTo(to, insideTo);
}

export class InRangeCriterion<T extends number | string = number | string> extends Criterion {
    constructor(
        from: T | undefined,
        to: T | undefined,
        inclusive: boolean | [boolean | undefined, boolean | undefined] = true,
    ) {
        super();

        if (from === undefined && to === undefined) {
            throw new Error("from & to can't both be undefined");
        }

        const valueTypes = uniq(
            [primitiveToType(from), primitiveToType(to)].filter(valueType =>
                ([Number, String] as Primitive[]).includes(valueType),
            ),
        );

        if (!valueTypes.length) {
            throw new Error("unsupported primitive types for from/to");
        } else if (valueTypes.length > 1) {
            throw new Error("from & to must be of the same type");
        }

        this.#valueType = valueTypes[0] as typeof String | typeof Number;
        let fromInclusive = false;
        let toInclusive = false;

        if (typeof inclusive === "boolean") {
            fromInclusive = inclusive;
            toInclusive = inclusive;
        } else if (inclusive.every(isBoolean)) {
            fromInclusive = inclusive[0] ?? true;
            toInclusive = inclusive[1] ?? true;
        }

        if (from !== undefined) {
            this.#from = Object.freeze({ value: from, inclusive: fromInclusive });
        }

        if (to !== undefined) {
            this.#to = Object.freeze({ value: to, inclusive: toInclusive });
        }

        if (this.#from === undefined && this.#to === undefined) {
            throw new Error("both from & to @ in-range were undefined");
        }
    }

    override readonly type = "in-range";
    readonly #valueType: typeof String | typeof Number;
    readonly #from?: Readonly<InRangeCriterionLimit<T>> | undefined;
    readonly #to?: Readonly<InRangeCriterionLimit<T>> | undefined;

    getValueType(): typeof String | typeof Number {
        return this.#valueType;
    }

    isNumber(): this is InRangeCriterion<number> {
        return this.#valueType === Number;
    }

    getFrom(): Readonly<InRangeCriterionLimit<T>> | undefined {
        return this.#from;
    }

    getTo(): Readonly<InRangeCriterionLimit<T>> | undefined {
        return this.#to;
    }

    override toString(): string {
        const parts: string[] = [];

        if (this.#from === undefined) {
            parts.push("[...");
        } else {
            const bracket = this.#from.inclusive ? "[" : "(";
            parts.push(`${bracket}${this.#from.value}`);
        }

        if (this.#to === undefined) {
            parts.push("...]");
        } else if (this.#to.inclusive) {
            parts.push(`${this.#to.value}]`);
        } else {
            const bracket = this.#to.inclusive ? "]" : ")";
            parts.push(`${this.#to.value}${bracket}`);
        }

        return parts.join(", ");
    }

    override contains(value: unknown): boolean {
        if (typeof value !== "string" && typeof value !== "number") {
            return false;
        }

        let matchesFrom = true;
        let matchesTo = true;

        if (this.#from !== undefined) {
            if (this.#from.inclusive) {
                matchesFrom = value >= this.#from.value;
            } else {
                matchesFrom = value > this.#from.value;
            }
        }

        if (this.#to !== undefined) {
            if (this.#to.inclusive) {
                matchesTo = value <= this.#to.value;
            } else {
                matchesTo = value < this.#to.value;
            }
        }

        return matchesFrom && matchesTo;
    }
}
