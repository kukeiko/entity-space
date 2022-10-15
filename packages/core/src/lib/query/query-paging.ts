import { InNumberRangeCriterion, inRange, inRangeTemplate } from "@entity-space/criteria";
import { isEqual } from "lodash";

export interface EntityQueryPagingSort {
    field: string;
    mode: "asc" | "desc";
}

export class QueryPaging {
    constructor({ sort, from, to }: { sort: EntityQueryPagingSort[]; from?: number; to?: number }) {
        this.sort = sort;

        if (from !== void 0 || to !== void 0) {
            this.range = new InNumberRangeCriterion([from, to]);
        }
    }

    private readonly sort: EntityQueryPagingSort[];
    private readonly range?: InNumberRangeCriterion;

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

    equivalent(other: QueryPaging): boolean {
        return this.subtract(other) === true && other.subtract(this) === true;
    }

    equivalentSort(other: QueryPaging): boolean {
        return isEqual(this.sort, other.sort);
    }

    mergeRange(other: QueryPaging): false | InNumberRangeCriterion {
        if (!this.range || !other.range) {
            // [todo] not sure if correct
            return false;
        }

        const merged = this.range.merge(other.range);

        if (!(merged instanceof InNumberRangeCriterion)) {
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
            const subtractedRange = this.range.reduce(other.range);

            if (typeof subtractedRange === "boolean") {
                return subtractedRange;
            }

            const remapped = inRangeTemplate(Number).remap(subtractedRange);

            if (remapped === false) {
                return false;
            }

            // [todo] hack - should add option to not map to lt/gt via template
            const toInclusiveRemapped = remapped.getCriteria().map(criterion => {
                let from = criterion.getFrom()?.value;

                if (from && criterion.getFrom()?.op == ">") {
                    from = from + 1;
                }

                let to = criterion.getTo()?.value;

                if (to && criterion.getTo()?.op == "<") {
                    to = to - 1;
                }

                return inRange(from, to) as InNumberRangeCriterion;
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
}
