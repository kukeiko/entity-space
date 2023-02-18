import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { IOrCriterion, IOrCriterion$ } from "./or-criterion.interface";

export class OrCriterion extends CriterionBase implements IOrCriterion {
    constructor({ criteria, tools }: { criteria: ICriterion[]; tools: IEntityCriteriaTools }) {
        super();
        this.criteria = Object.freeze(criteria);
        this.tools = tools;
    }

    readonly [IOrCriterion$] = true;
    readonly [ICriterion$] = true;
    private readonly tools: IEntityCriteriaTools;
    private readonly criteria: Readonly<ICriterion[]>;

    getCriteria(): ICriterion[] {
        return this.criteria.slice();
    }

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(other: ICriterion): false | ICriterion {
        const intersected: ICriterion[] = [];

        for (const mine of this.criteria) {
            const result = mine.intersect(other);

            if (result !== false) {
                if (this.tools.isOrCriterion(result)) {
                    intersected.push(...result.getCriteria());
                } else {
                    intersected.push(result);
                }
            }
        }

        if (intersected.length === 0) {
            return false;
        }

        return intersected.length === 1 ? intersected[0] : this.tools.or(intersected);
    }

    invert(): false | ICriterion {
        const inverted = this.criteria.map(criterion => criterion.invert());

        if (inverted.every(this.tools.isCriterion)) {
            const flattenedInverted = inverted
                .map(criterion => (this.tools.isOrCriterion(criterion) ? [...criterion.getCriteria()] : [criterion]))
                .reduce((acc, value) => [...acc, ...value], []);

            return this.tools.or(flattenedInverted);
        }

        return false;
    }

    contains(value: unknown): boolean {
        return this.criteria.some(criterion => criterion.contains(value));
    }

    merge(other: ICriterion): false | ICriterion {
        const unmerged: ICriterion[] = [];
        let merged = other;

        for (const criterion of this.criteria) {
            const mergeResult = criterion.merge(merged);

            if (mergeResult === false) {
                unmerged.push(criterion);
            } else {
                merged = mergeResult;
            }
        }

        const items = [merged, ...unmerged];

        return items.length === 1 ? items[0] : this.tools.or(items);
    }

    minus(other: ICriterion): boolean | ICriterion {
        const items: ICriterion[] = [];
        let didReduceAny = false;

        for (const mine of this.criteria) {
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

        return items.length === 0 ? true : items.length === 1 ? items[0] : this.tools.or(items);
    }

    override simplify(): ICriterion {
        const simplified = this.criteria.map(criterion => criterion.simplify());
        const withoutAll = simplified.filter(criterion => !this.tools.isAllCriterion(criterion));

        if (!withoutAll.length) {
            return this.tools.all();
        } else if (withoutAll.length === 1) {
            return withoutAll[0];
        } else {
            return this.tools.or(withoutAll);
        }
    }

    subtractFrom(other: ICriterion): boolean | ICriterion {
        let reduced = other;

        for (const mine of this.criteria) {
            const result = mine.subtractFrom(reduced);

            if (result === true) {
                return true;
            } else if (result !== false) {
                reduced = result;
            }
        }

        return reduced === other ? false : reduced;
    }

    override toString(): string {
        return `(${this.criteria.map(criterion => criterion.toString()).join(" | ")})`;
    }
}
