import { OrCriteriaTemplate } from ".";
import { isInstanceOf } from "../../../utils";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";
import { CriterionTemplate } from "../criterion-template.types";

export class OrCriteria<T extends Criterion = Criterion> extends Criteria<T> {
    readonly combinator: "|" = "|"; // otherwise typeof OrCriteria === typeof AndCriteria

    reduce(other: Criterion): boolean | Criterion {
        let reduced = other;

        for (const mine of this.items) {
            const result = mine.reduce(reduced);

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
            const reduced = other.reduce(mine);

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

    merge(other: Criterion): false | Criterion {
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

        if (merged === other) {
            return false;
        }

        const items = [merged, ...unmerged];

        return items.length === 1 ? items[0] : new OrCriteria(items);
    }

    intersect(other: Criterion): false | Criterion {
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

    invert(): false | Criterion {
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

    remapOne(template: CriterionTemplate): [false, undefined] | [Criterion, Criterion?] {
        if (template instanceof OrCriteriaTemplate) {
            let openItems = this.items.slice() as Criterion[];
            const remappedItems: Criterion[] = [];

            for (const criterion of this.items) {
                const [remapped, open] = criterion.remap(template.items);

                if (remapped !== false) {
                    openItems = openItems.filter(openItem => openItem !== criterion);

                    if (open !== void 0) {
                        openItems.push(open);
                    }

                    remappedItems.push(remapped);
                }
            }

            if (remappedItems.length > 0) {
                return [new OrCriteria(remappedItems), openItems.length > 0 ? new OrCriteria(openItems) : void 0];
            }
        } else {
            let openItems = this.items.slice() as Criterion[];

            for (const criterion of this.items) {
                const [remapped, open] = criterion.remapOne(template);

                if (remapped !== false) {
                    openItems = openItems.filter(openItem => openItem !== criterion);

                    if (open !== void 0) {
                        openItems.push(open);
                    }

                    return [remapped, new OrCriteria(openItems)];
                }
            }
        }

        return [false, void 0];
    }
}