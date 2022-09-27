import { InNumberRangeCriterion, inRangeTemplate } from "@entity-space/criteria";

export class QueryPaging {
    constructor(sortBy: string, top?: number, skip?: number) {
        this.sortBy = sortBy;

        if (top !== void 0 || skip !== void 0) {
            this.range = new InNumberRangeCriterion([skip, top]);
        }
    }

    private readonly sortBy: string;
    private readonly range?: InNumberRangeCriterion;

    getSortBy(): string {
        return this.sortBy;
    }

    getTop(): number | undefined {
        return this.range?.getTo()?.value;
    }

    getSkip(): number | undefined {
        return this.range?.getFrom()?.value;
    }

    reduce(other: QueryPaging): boolean | QueryPaging[] {
        if (this.sortBy !== other.getSortBy()) {
            return false;
        } else if (this.range === void 0) {
            return true;
        } else if (other.range === void 0) {
            return false;
        } else {
            const reduced = this.range.reduce(other.range);

            if (reduced) {
                return true;
            } else if (!reduced) {
                return false;
            } else {
                const remapped = inRangeTemplate(Number).remap(reduced);

                if (remapped === false) {
                    return false;
                }

                return remapped
                    .getCriteria()
                    .map(range => new QueryPaging(this.sortBy, range.getTo()?.value, range.getFrom()?.value));
            }
        }
    }
}
