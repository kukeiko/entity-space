import { isInstanceOf } from "@entity-space/utils";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";

export class OrCriteria<T extends Criterion = Criterion> extends Criteria<T> {
    readonly combinator: "|" = "|"; // otherwise typeof OrCriteria === typeof AndCriteria

    subtractFrom(other: Criterion): boolean | Criterion {
        let reduced = other;

        for (const mine of this.items) {
            const result = mine.subtractFrom(reduced);

            if (result === true) {
                return true;
            } else if (result !== false) {
                reduced = result;
            }
        }

        return reduced === other ? false : reduced;
    }

    reduceBy(other: Criterion): boolean | Criterion {
        const items: Criterion[] = [];
        let didReduceAny = false;

        for (const mine of this.getItems()) {
            const reduced = other.subtractFrom(mine);

            if (reduced === true) {
                didReduceAny = true;
            } else if (reduced !== false) {
                items.push(reduced);
                didReduceAny = true;
            } else {
                items.push(mine);
            }
        }

        if (!didReduceAny) {
            return false;
        }

        return items.length === 0 ? true : items.length === 1 ? items[0] : new OrCriteria(items);
    }

    override merge(other: Criterion): false | Criterion {
        const unmerged: Criterion[] = [];
        let merged = other;

        for (const criterion of this.getItems()) {
            const mergeResult = criterion.merge(merged);

            if (mergeResult === false) {
                unmerged.push(criterion);
            } else {
                merged = mergeResult;
            }
        }

        const items = [merged, ...unmerged];

        return items.length === 1 ? items[0] : new OrCriteria(items);
    }

    override intersect(other: Criterion): false | Criterion {
        const intersected: Criterion[] = [];

        for (const mine of this.getItems()) {
            const result = mine.intersect(other);

            if (result !== false) {
                if (result instanceof OrCriteria) {
                    // [todo] clone items?
                    intersected.push(...result.getItems());
                } else {
                    intersected.push(result);
                }
            }
        }

        if (intersected.length === 0) {
            return false;
        }

        return intersected.length === 1 ? intersected[0] : new OrCriteria(intersected);
    }

    // [todo] can't remember why i added this implementation :(
    // was used in NamedCriteria.intersect(), but that was imo wrong.
    intersectBy(other: Criterion): false | Criterion {
        let intersection = other;

        for (const item of this.getItems()) {
            const result = item.intersect(intersection);

            if (!result) {
                return false;
            }

            intersection = result;
        }

        return intersection;
    }

    override invert(): false | Criterion {
        const inverted = this.items.map(criterion => criterion.invert());

        if (inverted.every(isInstanceOf(Criterion))) {
            const flattenedInverted = inverted
                .map(criterion => (criterion instanceof OrCriteria ? [...criterion.getItems()] : [criterion]))
                .reduce((acc, value) => [...acc, ...value], []);

            return new OrCriteria(flattenedInverted);
        }

        return false;
    }

    toString(): string {
        return `(${this.items.map(item => item.toString()).join(" | ")})`;
    }

    matches(item: any): boolean {
        return this.items.some(criterion => criterion.matches(item));
    }
}
