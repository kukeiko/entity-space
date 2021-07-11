import { ValueCriterion } from "../value-criterion";
import { RangeCriterion } from "./range-criterion";

export class DateRangeCriterion extends RangeCriterion<string> {
    reduce(other: ValueCriterion): false | ValueCriterion<string>[] {
        if (other instanceof DateRangeCriterion) {
            const otherFrom = other.getFrom();
            const otherTo = other.getTo();
            const selfFrom = this.getFrom();
            const selfTo = this.getTo();

            if (otherFrom !== null && otherTo !== null) {
                const fromInside = this.isFromInsideFromTo(otherFrom);
                const toInside = this.isToInsideFromTo(otherTo);

                if (fromInside && toInside) {
                    return [];
                } else if (fromInside) {
                    if (selfTo === null) {
                        // [todo] this code path should never be hit because if selfTo === null, and fromInside is true, then toInside has to be true as well.
                        // we either throw an error or restructure the code so that we won't end up in impossible code paths
                    } else {
                        return [new DateRangeCriterion([selfTo.value, otherTo.value], [selfTo.op === "<", otherTo.op === "<="])];
                    }
                } else if (toInside) {
                    if (selfFrom === null) {
                        // [todo] this code path should never be hit because if selfFrom === null, and toInside is true, then fromInside has to be true as well.
                        // we either throw an error or restructure the code so that we won't end up in impossible code paths
                    } else {
                        return [new DateRangeCriterion([otherFrom.value, selfFrom.value], [otherFrom.op === ">=", selfFrom.op === ">"])];
                    }
                } else if (selfFrom !== null && selfTo !== null) {
                    const fromInside = RangeCriterion.isFromInsideFromTo(selfFrom, other);
                    const toInside = RangeCriterion.isToInsideFromTo(selfTo, other);

                    if (fromInside && toInside) {
                        return [
                            new DateRangeCriterion([otherFrom.value, selfFrom.value], [otherFrom.op === ">=", selfFrom.op === ">"]),
                            new DateRangeCriterion([selfTo.value, otherTo.value], [selfTo.op === "<", otherTo.op === "<="]),
                        ];
                    }
                }
            } else if (otherFrom !== null) {
                if (this.isFromInsideFromTo(otherFrom)) {
                    if (selfTo === null) {
                        return [];
                    } else {
                        return [new DateRangeCriterion([selfTo.value, void 0], selfTo.op === "<")];
                    }
                } else if (selfFrom !== null && selfTo !== null) {
                    const fromInside = this.isFromInsideFromTo(selfFrom);
                    const toInside = this.isToInsideFromTo(selfTo);

                    if (fromInside && toInside) {
                        return [
                            new DateRangeCriterion([otherFrom.value, selfFrom.value], [otherFrom.op === ">=", selfFrom.op === ">"]),
                            new DateRangeCriterion([selfTo.value, void 0], selfTo.op === "<"),
                        ];
                    }
                }
            } else if (otherTo !== null) {
                if (this.isToInsideFromTo(otherTo)) {
                    if (selfFrom === null) {
                        return [];
                    } else {
                        return [new DateRangeCriterion([void 0, selfFrom.value], selfFrom.op === ">")];
                    }
                } else if (selfFrom !== null && selfTo !== null) {
                    const fromInside = this.isFromInsideFromTo(selfFrom);
                    const toInside = this.isToInsideFromTo(selfTo);

                    if (fromInside && toInside) {
                        return [
                            new DateRangeCriterion([void 0, selfFrom.value], selfFrom.op === ">"),
                            new DateRangeCriterion([selfTo.value, otherTo.value], [selfTo.op === "<", otherTo.op === "<="]),
                        ];
                    }
                }
            } else {
                // [todo] ???
            }

            return false;
        }

        return false;
    }

    invert(): ValueCriterion<string>[] {
        const inverted: ValueCriterion<string>[] = [];

        if (this.from?.op !== void 0) {
            inverted.push(new DateRangeCriterion([void 0, this.from.value], this.from.op === ">"));
        }

        if (this.to?.op !== void 0) {
            inverted.push(new DateRangeCriterion([this.to.value, void 0], this.to.op === "<"));
        }

        return inverted;
    }
}
