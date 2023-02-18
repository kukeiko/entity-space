import { isEqual } from "lodash";
import { EntityCriteriaTools } from "../criteria/vnext/entity-criteria-tools";
import { EntityCriteriaShapeTools } from "../criteria/vnext/entity-criteria-shape-tools";
import { IInNumberRangeCriterion } from "../criteria/vnext/in-range/in-number-range-criterion.interface";
import { ReshapedCriterion } from "../criteria/vnext/reshaped-criterion";
import { IEntityCriteriaTools } from "../criteria/vnext/entity-criteria-tools.interface";
import { IEntityCriteriaShapeTools } from "../criteria/vnext/entity-criteria-shape-tools.interface";

export interface EntityQueryPagingSort {
    field: string;
    mode: "asc" | "desc";
}

export class QueryPaging {
    constructor({ sort, from, to }: { sort: EntityQueryPagingSort[]; from?: number; to?: number }) {
        this.sort = sort;

        if (from !== void 0 || to !== void 0) {
            // [todo] type assertion
            this.range = this.criteriaTools.inRange(from, to) as IInNumberRangeCriterion;
        }
    }

    private readonly sort: EntityQueryPagingSort[];
    private readonly range?: IInNumberRangeCriterion;
    private readonly criteriaTools: IEntityCriteriaTools = new EntityCriteriaTools();
    private readonly shapeTools: IEntityCriteriaShapeTools = new EntityCriteriaShapeTools({
        criteriaTools: this.criteriaTools,
    });

    getSort(): EntityQueryPagingSort[] {
        return this.sort;
    }

    getTop(): number | undefined {
        const [from, to] = [this.range?.getFrom()?.value, this.range?.getTo()?.value];

        if (from !== void 0 && to !== void 0) {
            return to - from;
        }

        return to;
    }

    getSkip(): number | undefined {
        return this.range?.getFrom()?.value;
    }

    getFrom(): number | undefined {
        return this.range?.getFrom()?.value;
    }

    getTo(): number | undefined {
        return this.range?.getTo()?.value;
    }

    equivalent(other: QueryPaging): boolean {
        return this.subtract(other) === true && other.subtract(this) === true;
    }

    equivalentSort(other: QueryPaging): boolean {
        return isEqual(this.sort, other.sort);
    }

    mergeRange(other: QueryPaging): false | IInNumberRangeCriterion {
        if (!this.range || !other.range) {
            // [todo] not sure if correct
            return false;
        }

        const merged = this.range.merge(other.range);

        if (!this.criteriaTools.isInNumberRangeCriterion(merged)) {
            return false;
        }

        return merged;
    }

    subtract(other: QueryPaging): boolean | QueryPaging[] {
        if (!isEqual(this.sort, other.sort)) {
            return false;
        } else if (this.range === void 0) {
            return true;
        } else if (other.range === void 0) {
            return false;
        } else {
            const subtractedRange = this.range.subtractFrom(other.range);

            if (typeof subtractedRange === "boolean") {
                return subtractedRange;
            }

            // [todo] type assertion
            const remapped = this.shapeTools.inRange(Number).reshape(subtractedRange) as
                | false
                | ReshapedCriterion<IInNumberRangeCriterion>;

            if (remapped === false) {
                return false;
            }

            // [todo] hack - should add option to not map to lt/gt via template
            const toInclusiveRemapped = remapped.getReshaped().map(criterion => {
                let from = criterion.getFrom()?.value;

                if (from && criterion.getFrom()?.op == ">") {
                    from = from + 1;
                }

                let to = criterion.getTo()?.value;

                if (to && criterion.getTo()?.op == "<") {
                    to = to - 1;
                }

                // [todo] type assertion
                return this.criteriaTools.inRange(from, to) as IInNumberRangeCriterion;
            });

            return toInclusiveRemapped.map(
                range =>
                    new QueryPaging({
                        sort: this.sort.slice(),
                        to: range.getTo()?.value,
                        from: range.getFrom()?.value,
                    })
            );
        }
    }

    toString(): string {
        const parts: string[] = [];

        for (const sort of this.sort) {
            if (sort.mode === "desc") {
                parts.push(`!${sort.field}`);
            } else {
                parts.push(sort.field);
            }
        }

        const from = this.getFrom();

        if (from === void 0) {
            parts.push("...");
        } else {
            parts.push(from.toString());
        }

        const to = this.getTo();

        if (to === void 0) {
            parts.push("...");
        } else {
            parts.push(to.toString());
        }

        return `[${parts.join(", ")}]`;
    }
}
