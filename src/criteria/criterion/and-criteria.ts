import { OrCriteria } from "./or-criteria";
import { Criteria } from "./criteria";
import { Criterion } from "./criterion";

export class AndCriteria<T extends Criterion = Criterion> extends Criteria<T> {
    reduce(other: Criterion): boolean | Criterion {
        const items = this.items.map(criterion => ({ criterion, result: criterion.reduce(other) }));

        if (items.every(x => x.result === false)) {
            return false;
        } else if (items.every(x => x.result === true)) {
            return true;
        }

        // we want items that did an actual reduction to be put first
        items.sort((a, b) => {
            if (a.result === false && b.result === false) {
                return 0;
            } else if (a.result !== false && b.result === false) {
                return -1;
            } else if (a.result === false && b.result !== false) {
                return 1;
            } else {
                return 0;
            }
        });

        const reduced: Criterion[][] = [];
        const accumulated: Criterion[] = [];

        for (const item of items) {
            if (item.result === true) {
                continue;
            }

            const reducedCriterion = item.result === false ? item.criterion.invert() : item.result;
            reduced.push([...accumulated, reducedCriterion]);
            accumulated.push(item.criterion);
        }

        if (reduced.length === 0) {
            return true;
        }

        return new OrCriteria(reduced.map(foo => (foo.length === 1 ? foo[0] : new AndCriteria(foo))));
    }

    reduceBy(other: Criterion): boolean | Criterion {
        const items: Criterion[] = [];
        let didReduceAny = false;

        for (const mine of this.getItems()) {
            const reduced = other.reduce(mine);

            if (reduced === true) {
                return true;
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

        return items.length === 1 ? items[0] : new AndCriteria(items);
    }

    invert(): Criterion {
        return new AndCriteria(this.items.map(criterion => criterion.invert()));
    }

    toString(): string {
        return `(${this.items.map(item => item.toString()).join(" & ")})`;
    }
}
