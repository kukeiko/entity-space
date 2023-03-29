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

        if (inverted.every(this.tools.isCriterion)) {
            const flattenedInverted = inverted
                .map(criterion => (this.tools.isOrCriterion(criterion) ? [...criterion.getCriteria()] : [criterion]))
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
        let didSubtractAny = false;

        for (const mine of this.criteria) {
            const subtracted = other.subtractFrom(mine);

            if (subtracted === true) {
                return true;
            } else if (subtracted !== false) {
                items.push(subtracted);
                didSubtractAny = true;
            } else {
                items.push(mine);
            }
        }

        if (!didSubtractAny) {
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

        // we want items that did an actual subtraction to be put first
        items.sort((a, b) => {
            if (a.result !== false && b.result === false) {
                return -1;
            } else if (a.result === false && b.result !== false) {
                return 1;
            } else {
                return 0;
            }
        });

        const subtracted: ICriterion[][] = [];
        const accumulated: ICriterion[] = [];

        for (const item of items) {
            if (item.result === true) {
                continue;
            }

            const subtractedCriterion = item.result === false ? item.criterion.invert() : item.result;

            if (subtractedCriterion === false) {
                return false;
            }

            subtracted.push([...accumulated, subtractedCriterion]);
            accumulated.push(item.criterion);
        }

        if (subtracted.length === 0) {
            return true;
        }

        return this.tools.or(
            subtracted.map(criteria => (criteria.length === 1 ? criteria[0] : this.tools.and(criteria)))
        );
    }

    override toString(): string {
        return `(${this.criteria.map(criterion => criterion.toString()).join(" & ")})`;
    }
}
