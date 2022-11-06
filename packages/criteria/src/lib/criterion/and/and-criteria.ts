import { isInstanceOf } from "@entity-space/utils";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";
import { OrCriteria } from "../or/or-criteria";

export class AndCriteria<T extends Criterion = Criterion> extends Criteria<T> {
    readonly combinator: "&" = "&"; // otherwise typeof OrCriteria === typeof AndCriteria

    subtractFrom(other: Criterion): boolean | Criterion {
        const items = this.items.map(criterion => ({ criterion, result: criterion.subtractFrom(other) }));

        if (items.every(x => x.result === false)) {
            return false;
        } else if (items.every(x => x.result === true)) {
            return true;
        }

        // we want items that did an actual reduction to be put first
        items.sort((a, b) => {
            if (a.result !== false && b.result === false) {
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

            if (reducedCriterion === false) {
                return false;
            }

            reduced.push([...accumulated, reducedCriterion]);
            accumulated.push(item.criterion);
        }

        if (reduced.length === 0) {
            return true;
        }

        return new OrCriteria(
            reduced.map(criteria => (criteria.length === 1 ? criteria[0] : new AndCriteria(criteria)))
        );
    }

    reduceBy(other: Criterion): boolean | Criterion {
        const items: Criterion[] = [];
        let didReduceAny = false;

        for (const mine of this.getItems()) {
            const reduced = other.subtractFrom(mine);

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

    override invert(): false | Criterion {
        const inverted = this.items.map(item => item.invert());

        if (inverted.every(isInstanceOf(Criterion))) {
            const flattenedInverted = inverted
                .map(criterion => (criterion instanceof OrCriteria ? [...criterion.getItems()] : [criterion]))
                .reduce((acc, value) => [...acc, ...value], []);

            return new OrCriteria(flattenedInverted);
        }

        return false;
    }

    toString(): string {
        return `(${this.items.map(item => item.toString()).join(" & ")})`;
    }

    matches(item: any): boolean {
        return this.items.every(criterion => criterion.matches(item));
    }
}
