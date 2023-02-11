import { Class, getInstanceClass } from "@entity-space/utils";
import { IAndCriterion } from "../and/and-criterion.interface";
import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { IOrCriterion } from "../or/or-criterion.interface";

export type FromCriterion<T> = {
    op: ">=" | ">";
    value: T;
};

export type ToCriterion<T> = {
    op: "<=" | "<";
    value: T;
};

export abstract class InRangeCriterion<T> extends CriterionBase implements ICriterion {
    constructor(
        values: [T | undefined, T | undefined],
        inclusive: boolean | [boolean, boolean] = true,
        protected readonly factory: IEntityCriteriaFactory
    ) {
        super();
        if (typeof inclusive === "boolean") {
            inclusive = [inclusive, inclusive];
        }

        if (values[0] !== void 0) {
            this.from = Object.freeze({
                op: inclusive[0] ? ">=" : ">",
                value: values[0],
            });
        } else {
            this.from = null;
        }

        if (values[1] !== void 0) {
            this.to = Object.freeze({
                op: inclusive[1] ? "<=" : "<",
                value: values[1],
            });
        } else {
            this.to = null;
        }

        if (this.from === null && this.to === null) {
            throw new Error("both from & to @ in-range were null");
        }

        this.selfClass = getInstanceClass(this);
    }

    private readonly selfClass: Class<this>;
    protected readonly from: Readonly<FromCriterion<T>> | null;
    protected readonly to: Readonly<ToCriterion<T>> | null;
    readonly [ICriterion$] = true;

    getFrom(): Readonly<FromCriterion<T>> | null {
        return this.from;
    }

    getTo(): Readonly<ToCriterion<T>> | null {
        return this.to;
    }

    static isFromBiggerThanFrom<T>(a: FromCriterion<T> | null, b: FromCriterion<T> | null): boolean {
        if (a === null) {
            return false;
        } else if (b === null) {
            return true;
        } else if (a.op === ">=" && b.op === ">") {
            return a.value > b.value;
        } else {
            return a.value >= b.value;
        }
    }

    static isFromSmallerThanTo<T>(a: FromCriterion<T> | null, b: ToCriterion<T> | null): boolean {
        if (b === null || a === null) {
            return true;
        } else if (a.op === ">=" && b.op === "<=") {
            return a.value <= b.value;
        } else {
            return a.value < b.value;
        }
    }

    static isFromInsideRange<T>(a: FromCriterion<T> | null, b: InRangeCriterion<T>): boolean {
        return this.isFromBiggerThanFrom(a, b.getFrom()) && this.isFromSmallerThanTo(a, b.getTo());
    }

    static isToBiggerThanFrom<T>(to: ToCriterion<T> | null, from: FromCriterion<T> | null): boolean {
        if (from === null || to === null) {
            return true;
        } else if (to.op === "<=" && from.op === ">=") {
            return to.value >= from.value;
        } else {
            return to.value > from.value;
        }
    }

    static isToSmallerThanTo<T>(toA: ToCriterion<T> | null, toB: ToCriterion<T> | null): boolean {
        if (toA === null) {
            return false;
        } else if (toB === null) {
            return true;
        } else if (toA.op === "<=" && toB.op === "<") {
            return toA.value < toB.value;
        } else {
            return toA.value <= toB.value;
        }
    }

    static isToInsideRange<T>(to: ToCriterion<T> | null, range: InRangeCriterion<T>): boolean {
        return this.isToBiggerThanFrom(to, range.getFrom()) && this.isToSmallerThanTo(to, range.getTo());
    }

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    minus(other: ICriterion): boolean | ICriterion {
        return false;
    }

    subtractFrom(other: ICriterion): boolean | ICriterion {
        if (IOrCriterion.is(other) || IAndCriterion.is(other)) {
            return other.minus(this);
        } else if (other instanceof this.selfClass) {
            const otherFrom = other.getFrom();
            const otherTo = other.getTo();
            const selfFrom = this.getFrom();
            const selfTo = this.getTo();

            const otherFromInsideMe = InRangeCriterion.isFromInsideRange(other.getFrom(), this);
            const otherToInsideMe = InRangeCriterion.isToInsideRange(other.getTo(), this);

            if (otherFromInsideMe && otherToInsideMe) {
                return true;
            } else if (otherFromInsideMe) {
                if (selfTo === null) {
                    return true;
                } else {
                    return new this.selfClass(
                        [selfTo.value, otherTo?.value],
                        [selfTo.op === "<", otherTo?.op === "<="],
                        this.factory
                    );
                }
            } else if (otherToInsideMe) {
                if (selfFrom === null) {
                    return true;
                } else {
                    return new this.selfClass(
                        [otherFrom?.value, selfFrom.value],
                        [otherFrom?.op === ">=", selfFrom.op === ">"],
                        this.factory
                    );
                }
            } else if (
                InRangeCriterion.isFromInsideRange(selfFrom, other) &&
                InRangeCriterion.isToInsideRange(selfTo, other)
            ) {
                return this.factory.or([
                    new this.selfClass(
                        [otherFrom?.value, selfFrom?.value],
                        [otherFrom?.op === ">=", selfFrom?.op === ">"],
                        this.factory
                    ),
                    new this.selfClass(
                        [selfTo?.value, otherTo?.value],
                        [selfTo?.op === "<", otherTo?.op === "<="],
                        this.factory
                    ),
                ]);
            }
        }

        return false;
    }

    merge(other: ICriterion): false | ICriterion {
        if (IOrCriterion.is(other) || IAndCriterion.is(other)) {
            return other.merge(this);
        } else if (other instanceof this.selfClass) {
            const otherFrom = other.getFrom();
            const otherTo = other.getTo();
            const selfFrom = this.getFrom();
            const selfTo = this.getTo();

            const otherFromInsideMe = InRangeCriterion.isFromInsideRange(other.getFrom(), this);
            const otherToInsideMe = InRangeCriterion.isToInsideRange(other.getTo(), this);

            if (otherFromInsideMe && otherToInsideMe) {
                // copy self
                return new this.selfClass(
                    [selfFrom?.value, selfTo?.value],
                    [selfFrom?.op === ">=", selfTo?.op === "<="],
                    this.factory
                );
            } else if (otherFromInsideMe) {
                if (selfTo === null) {
                    return new this.selfClass([selfFrom?.value, void 0], selfFrom?.op === ">=", this.factory);
                } else {
                    return new this.selfClass(
                        [selfFrom?.value, otherTo?.value],
                        [selfFrom?.op === ">=", otherTo?.op === "<="],
                        this.factory
                    );
                }
            } else if (otherToInsideMe) {
                if (selfFrom === null) {
                    return new this.selfClass([void 0, selfTo?.value], selfTo?.op === "<=", this.factory);
                } else {
                    return new this.selfClass(
                        [otherFrom?.value, selfTo?.value],
                        [otherFrom?.op === ">=", selfTo?.op === "<="],
                        this.factory
                    );
                }
            } else if (
                InRangeCriterion.isFromInsideRange(selfFrom, other) &&
                InRangeCriterion.isToInsideRange(selfTo, other)
            ) {
                // copy other
                return new this.selfClass(
                    [otherFrom?.value, otherTo?.value],
                    [otherFrom?.op === ">=", otherTo?.op === "<="],
                    this.factory
                );
            }
        }

        return false;
    }

    intersect(other: ICriterion): false | ICriterion {
        if (IOrCriterion.is(other) || IAndCriterion.is(other)) {
            return other.intersect(this);
        } else if (other instanceof this.selfClass) {
            const [otherFrom, otherTo, selfFrom, selfTo] = [
                other.getFrom(),
                other.getTo(),
                this.getFrom(),
                this.getTo(),
            ];
            const otherFromInsideMe = InRangeCriterion.isFromInsideRange(other.getFrom(), this);
            const otherToInsideMe = InRangeCriterion.isToInsideRange(other.getTo(), this);

            if (otherFromInsideMe && otherToInsideMe) {
                return new this.selfClass(
                    [otherFrom?.value, otherTo?.value],
                    [otherFrom?.op === ">=", otherTo?.op === "<="],
                    this.factory
                );
            } else if (otherFromInsideMe) {
                if (selfTo === null) {
                    return new this.selfClass([otherFrom?.value, void 0], otherFrom?.op === ">=", this.factory);
                } else {
                    return new this.selfClass(
                        [otherFrom?.value, selfTo.value],
                        [otherFrom?.op === ">=", selfTo.op === "<="],
                        this.factory
                    );
                }
            } else if (otherToInsideMe) {
                if (selfFrom === null) {
                    return new this.selfClass([void 0, otherTo?.value], otherTo?.op === "<=", this.factory);
                } else {
                    return new this.selfClass(
                        [selfFrom.value, otherTo?.value],
                        [selfFrom.op === ">=", otherTo?.op === "<="],
                        this.factory
                    );
                }
            } else if (
                InRangeCriterion.isFromInsideRange(selfFrom, other) &&
                InRangeCriterion.isToInsideRange(selfTo, other)
            ) {
                return new this.selfClass(
                    [selfFrom?.value, selfTo?.value],
                    [selfFrom?.op === ">=", selfTo?.op === "<="],
                    this.factory
                );
            }
        }

        return false;
    }

    invert(): ICriterion {
        const inverted: ICriterion[] = [];

        if (this.from?.op !== void 0) {
            inverted.push(new this.selfClass([void 0, this.from.value], this.from.op === ">", this.factory));
        }

        if (this.to?.op !== void 0) {
            inverted.push(new this.selfClass([this.to.value, void 0], this.to.op === "<", this.factory));
        }

        return inverted.length === 1 ? inverted[0] : this.factory.or(inverted);
    }

    override toString(): string {
        const shards: string[] = [];

        if (this.from === null) {
            shards.push("[...");
        } else if (this.from.op === ">") {
            shards.push(`(${this.from.value}`);
        } else {
            shards.push(`[${this.from.value}`);
        }

        if (this.to === null) {
            shards.push("...]");
        } else if (this.to.op === "<") {
            shards.push(`${this.to.value})`);
        } else {
            shards.push(`${this.to.value}]`);
        }

        return shards.join(", ");
    }

    contains(value: unknown): boolean {
        if (typeof value !== "string" || typeof value !== "number") {
            return false;
        }

        let matchesFrom = true;
        let matchesTo = true;

        if (this.from !== null) {
            if (this.from.op === ">=") {
                matchesFrom = value >= this.from.value;
            } else {
                matchesFrom = value > this.from.value;
            }
        }

        if (this.to !== null) {
            if (this.to.op === "<=") {
                matchesTo = value <= this.to.value;
            } else {
                matchesTo = value < this.to.value;
            }
        }

        return matchesFrom && matchesTo;
    }
}
