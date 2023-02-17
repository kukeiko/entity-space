import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { IOrCriterion } from "../or/or-criterion.interface";
import { IAndCriterion, IAndCriterion$ } from "./and-criterion.interface";

export class AndCriterion extends CriterionBase implements IAndCriterion {
    constructor({ criteria, tools }: { criteria: ICriterion[]; tools: IEntityCriteriaTools }) {
        super();
        this.criteria = Object.freeze(criteria);
        this.tools = tools;
    }

    readonly [IAndCriterion$] = true;
    readonly [ICriterion$] = true;
    private readonly tools: IEntityCriteriaTools;
    private readonly criteria: Readonly<ICriterion[]>;

    getCriteria(): ICriterion[] {
        return this.criteria.slice();
    }

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(_: ICriterion): false | ICriterion {
        return false;
    }

    invert(): false | ICriterion {
        const inverted = this.criteria.map(crition => crition.invert());

        if (inverted.every(ICriterion.is)) {
            const flattenedInverted = inverted
                .map(criterion => (IOrCriterion.is(criterion) ? [...criterion.getCriteria()] : [criterion]))
                .reduce((acc, value) => [...acc, ...value], []);

            return this.tools.or(flattenedInverted);
        }

        return false;
    }

    contains(value: unknown): boolean {
        return this.criteria.every(criterion => criterion.contains(value));
    }

    merge(other: ICriterion): false | ICriterion {
        return false;
    }

    minus(other: ICriterion): boolean | ICriterion {
        const items: ICriterion[] = [];
        let didReduceAny = false;

        for (const mine of this.criteria) {
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

        return items.length === 1 ? items[0] : this.tools.and(items);
    }

    override simplify(): ICriterion {
        const simplified = this.criteria.map(criterion => criterion.simplify());
        const withoutAll = simplified.filter(criterion => !this.tools.isAllCriterion(criterion));

        if (!withoutAll.length) {
            return this.tools.all();
        } else if (withoutAll.length === 1) {
            return withoutAll[0];
        } else {
            return this.tools.and(withoutAll);
        }
    }

    subtractFrom(other: ICriterion): boolean | ICriterion {
        const items = this.criteria.map(criterion => ({ criterion, result: criterion.subtractFrom(other) }));

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

        const reduced: ICriterion[][] = [];
        const accumulated: ICriterion[] = [];

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

        return this.tools.or(reduced.map(criteria => (criteria.length === 1 ? criteria[0] : this.tools.and(criteria))));
    }

    override toString(): string {
        return `(${this.criteria.map(criterion => criterion.toString()).join(" | ")})`;
    }
}
