import { UnpackedEntitySelection } from "@entity-space/common";
import { AndCriteria } from "../and/and-criteria";
import { AnyCriterion } from "../any/any";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";
import { OrCriteria } from "../or/or-criteria";

export type NamedCriteriaBag = Record<string, Criterion | undefined>;

// [todo] the way i added ability to specify required items was a quick fix, revisit if we can make it cleaner/nicer.
export class NamedCriteria<T extends NamedCriteriaBag = NamedCriteriaBag, R extends keyof T = never> extends Criterion {
    constructor(items: T) {
        super();

        if (Object.keys(items).length === 0) {
            throw new Error(`can not create empty named criteria`);
        }

        this.bag = Object.freeze(items);
    }

    // [todo] rename to "items", as "bag" in programming terms would be a collection where order doesn't matter,
    // and (at least for now, and i currently don't see how else) order does have an effect in the order of criteria
    // returned when reducing.
    readonly bag: Readonly<Partial<T>>;

    // [todo] rename to "getItems()"
    getBag(): Readonly<Partial<T> & Required<Pick<T, R>>> {
        return this.bag as any;
    }

    getByPath(path: string[]): Criterion | undefined {
        if (path.length === 0) {
            throw new Error("empty path");
        }

        const criterion = this.bag[path[0]];

        if (path.length === 1) {
            return criterion;
        }

        if (criterion instanceof NamedCriteria) {
            return criterion.getByPath(path.slice(1));
        } else {
            throw new Error("not named-criteria");
        }
    }

    subtractFrom(other: Criterion): boolean | Criterion {
        if (other instanceof Criteria) {
            return other.reduceBy(this);
        } else if (other instanceof NamedCriteria) {
            // same reduction mechanics as found in and-criteria.ts
            const otherBag = other.getBag();
            const reductions: (
                | {
                      result: Criterion | true;
                      key: string;
                      inverted?: never;
                  }
                | {
                      result: false;
                      key: string;
                      inverted: Criterion;
                  }
            )[] = [];

            for (const key in this.bag) {
                const mine = this.bag[key];

                if (mine === void 0) {
                    continue;
                }

                // [todo] is any? seems like i broke it without realizing during implementation of criterion templates
                const otherCriterion = otherBag[key];

                if (otherCriterion === void 0) {
                    const inverted = mine.invert();

                    if (inverted === false) {
                        return false;
                    }

                    reductions.push({ key, result: false, inverted });
                } else {
                    const result = mine.subtractFrom(otherCriterion);

                    if (result === false) {
                        return false;
                    }

                    reductions.push({ key, result });
                }
            }

            if (reductions.every(x => x.result === false)) {
                return false;
            } else if (reductions.every(x => x.result === true)) {
                return true;
            }

            // we want items that did an actual reduction to be put first
            reductions.sort((a, b) => {
                if (a.result !== false && b.result === false) {
                    return -1;
                } else if (a.result === false && b.result !== false) {
                    return 1;
                } else {
                    return 0;
                }
            });

            const accumulator: Record<string, Criterion> = { ...other.getBag() };
            const built: Record<string, Criterion>[] = [];

            for (const { key, result, inverted } of reductions) {
                if (result === true) {
                    continue;
                } else if (result === false) {
                    built.push({ ...accumulator, [key]: inverted });
                    accumulator[key] = this.bag[key]!;
                } else {
                    built.push({ ...accumulator, [key]: result });
                    accumulator[key] = this.bag[key]!;
                }
            }

            return built.length === 1
                ? new NamedCriteria(built[0])
                : new OrCriteria(built.map(bag => new NamedCriteria(bag)));
        }

        return false;
    }

    override intersect(other: Criterion): false | Criterion {
        if (other instanceof AnyCriterion) {
            // [todo] apply this to all other criteria [update] => what did i mean by this?
            return this;
        } else if (other instanceof OrCriteria) {
            return other.intersect(this);
            // [todo] apply this to all other criteria [update] => what did i mean by this?
            // [todo] i don't remember why i implemented "intersectBy()" :(
            // return other.intersectBy(this);
        } else if (!(other instanceof NamedCriteria)) {
            return false;
        }

        const keys = new Set([...Object.keys(this.bag), ...Object.keys(other.bag)]);
        const bag: NamedCriteriaBag = {};

        for (const key of keys) {
            const left = this.bag[key];
            const right = other.bag[key];

            if (!left) {
                bag[key] = right;
            } else if (!right) {
                bag[key] = left;
            } else {
                const intersection = left.intersect(right);

                if (!intersection) {
                    return false;
                }

                bag[key] = intersection;
            }
        }

        return new NamedCriteria(bag);
    }

    override invert(): false | Criterion {
        const invertedItems: Record<string, Criterion> = {};

        for (const key in this.bag) {
            const criterion = this.bag[key];

            if (criterion === void 0) {
                return false;
            }

            const inverted = criterion.invert();

            if (inverted === false) {
                return false;
            }

            invertedItems[key] = inverted;
        }

        const accumulator: Record<string, Criterion> = {};
        const built: Record<string, Criterion>[] = [];

        for (const key in invertedItems) {
            const inverted = invertedItems[key];
            built.push({ ...accumulator, [key]: inverted });
            accumulator[key] = this.bag[key]!;
        }

        return built.length === 1
            ? new NamedCriteria(built[0])
            : new OrCriteria(built.map(bag => new NamedCriteria(bag)));
    }

    toString(): string {
        const shards: string[] = [];

        for (const key in this.bag) {
            const criteria = this.bag[key];
            if (criteria === void 0) continue;

            shards.push(`${key}: ${criteria.toString()}`);
        }

        return `{ ${shards.join(", ")} }`;
    }

    matches(item: any): boolean {
        if (item == null || typeof item !== "object") {
            return false;
        }

        for (const key in this.bag) {
            const criterion = this.bag[key];

            if (!criterion?.matches(item[key])) {
                return false;
            }
        }

        return true;
    }

    override merge(other: Criterion): false | Criterion {
        if (other.subtractFrom(this) === true) {
            return other;
        } else if (this.subtractFrom(other) === true) {
            return this;
        } else if (other instanceof Criteria) {
            return other.merge(this);
        } else if (other instanceof NamedCriteria) {
            const mergedBag: Record<string, Criterion> = {};
            const otherBag = other.getBag();
            let mergedOne = false;

            for (const key in this.bag) {
                const myBagCriterion = this.bag[key];
                // [todo] is any? seems like i broke it without realizing during implementation of criterion templates
                const otherBagCriterion = otherBag[key];

                if (myBagCriterion === void 0) {
                    if (otherBagCriterion !== void 0) {
                        return false;
                    }

                    continue;
                } else if (otherBagCriterion === void 0) {
                    return false;
                } else if (otherBagCriterion instanceof Criterion) {
                    const mergedResult = myBagCriterion.merge(otherBagCriterion);

                    if (mergedResult === false) {
                        return false;
                    }

                    // [todo] could we use Criterion.equivalent() here?
                    const isMineSubsetOfOther = myBagCriterion.subtractFrom(otherBagCriterion) === true;
                    const isOtherSubsetOfMine = otherBagCriterion.subtractFrom(myBagCriterion) === true;

                    if (!(isMineSubsetOfOther && isOtherSubsetOfMine)) {
                        if (mergedOne) {
                            return false;
                        }

                        mergedOne = true;
                    }

                    mergedBag[key] = mergedResult;
                }
            }

            return new NamedCriteria(mergedBag);
        } else {
            return false;
        }
    }

    static omitSelection(criterion: Criterion, selection: UnpackedEntitySelection): Criterion {
        if (criterion instanceof OrCriteria) {
            // [todo] no clue currently why .getItems() returns any[]
            const omitted = (criterion.getItems() as Criterion[])
                .map(criterion => this.omitSelection(criterion, selection))
                .filter(criterion => !(criterion instanceof AnyCriterion));

            if (omitted.length == 0) {
                return new AnyCriterion();
            } else {
                return new OrCriteria(omitted);
            }
        } else if (criterion instanceof AndCriteria) {
            // [todo] no clue currently why .getItems() returns any[]
            const omitted = (criterion.getItems() as Criterion[])
                .map(criterion => this.omitSelection(criterion, selection))
                .filter(criterion => !(criterion instanceof AnyCriterion));

            if (omitted.length == 0) {
                return new AnyCriterion();
            } else {
                return new AndCriteria(omitted);
            }
        } else if (criterion instanceof NamedCriteria) {
            const omittedBag: NamedCriteriaBag = { ...criterion.getBag() };

            for (const key in selection) {
                const selectionItem = selection[key];

                if (selectionItem === true) {
                    delete omittedBag[key];
                } else if (selectionItem) {
                    const bagItem = omittedBag[key];

                    if (bagItem instanceof NamedCriteria) {
                        const omitted = this.omitSelection(bagItem, selectionItem);

                        if (omitted instanceof AnyCriterion) {
                            delete omittedBag[key];
                        } else {
                            omittedBag[key] = omitted;
                        }
                    } else {
                        delete omittedBag[key];
                    }
                }
            }

            if (Object.keys(omittedBag).length) {
                return new NamedCriteria(omittedBag);
            } else {
                return new AnyCriterion();
            }
        } else {
            return criterion;
        }
    }
}
