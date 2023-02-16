import { isPrimitiveOrNull } from "@entity-space/utils";
import { UnpackedEntitySelection } from "../../../common/unpacked-entity-selection.type";
import { IAllCriterion } from "../all/all-criterion.interface";
import { IAndCriterion } from "../and/and-criterion.interface";
import { CriterionBase } from "../criterion-base";
import { ICriterion, ICriterion$ } from "../criterion.interface";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { IOrCriterion } from "../or/or-criterion.interface";
import { IEntityCriteria, IEntityCriteria$ } from "./entity-criteria.interface";

export class EntityCriteria extends CriterionBase implements IEntityCriteria {
    constructor({ criteria, factory }: { criteria: Record<string, ICriterion>; factory: IEntityCriteriaFactory }) {
        super();
        this.criteria = Object.freeze(criteria);
        this.factory = factory;
    }

    readonly [IEntityCriteria$] = true;
    readonly [ICriterion$] = true;
    private readonly factory: IEntityCriteriaFactory;
    private readonly criteria: Readonly<Record<string, ICriterion>>;

    getCriteria(): Readonly<Record<string, ICriterion>> {
        return this.criteria;
    }

    getByPath(path: string[]): ICriterion | undefined {
        if (path.length === 0) {
            throw new Error("empty path");
        }

        const criterion = this.criteria[path[0]];

        if (path.length === 1) {
            return criterion;
        }

        if (IEntityCriteria.is(criterion)) {
            return criterion.getByPath(path.slice(1));
        } else {
            throw new Error("not an entity-criteria");
        }
    }

    equivalent(other: ICriterion): boolean {
        return this.subtractFrom(other) === true && other.subtractFrom(this) === true;
    }

    intersect(other: ICriterion): false | ICriterion {
        if (IAllCriterion.is(other)) {
            // [todo] apply this to all other criteria [update] => what did i mean by this?
            return this;
        } else if (IOrCriterion.is(other)) {
            return other.intersect(this);
            // [todo] apply this to all other criteria [update] => what did i mean by this?
            // [todo] i don't remember why i implemented "intersectBy()" :(
            // return other.intersectBy(this);
        } else if (!IEntityCriteria.is(other)) {
            return false;
        }

        const keys = new Set([...Object.keys(this.criteria), ...Object.keys(other.getCriteria())]);
        const bag: Record<string, ICriterion> = {};

        for (const key of keys) {
            const left = this.criteria[key];
            const right = other.getCriteria()[key];

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

        return this.factory.where(bag);
    }

    invert(): false | ICriterion {
        const invertedItems: Record<string, ICriterion> = {};

        for (const key in this.criteria) {
            const criterion = this.criteria[key];

            if (criterion === void 0) {
                return false;
            }

            const inverted = criterion.invert();

            if (inverted === false) {
                return false;
            }

            invertedItems[key] = inverted;
        }

        const accumulator: Record<string, ICriterion> = {};
        const built: Record<string, ICriterion>[] = [];

        for (const key in invertedItems) {
            const inverted = invertedItems[key];
            built.push({ ...accumulator, [key]: inverted });
            accumulator[key] = this.criteria[key]!;
        }

        return built.length === 1
            ? this.factory.where(built[0])
            : this.factory.or(built.map(bag => this.factory.where(bag)));
    }

    contains(value: unknown): boolean {
        if (isPrimitiveOrNull(value) || typeof value !== "object") {
            return false;
        }

        return Object.entries(this.criteria).every(([key, criterion]) =>
            criterion.contains((value as Record<string, unknown>)[key])
        );
    }

    merge(other: ICriterion): false | ICriterion {
        if (other.subtractFrom(this) === true) {
            return other;
        } else if (this.subtractFrom(other) === true) {
            return this;
        } else if (IOrCriterion.is(other) || IAndCriterion.is(other)) {
            return other.merge(this);
        } else if (IEntityCriteria.is(other)) {
            const mergedBag: Record<string, ICriterion> = {};
            const otherBag = other.getCriteria();
            let mergedOne = false;

            for (const key in this.criteria) {
                const myBagCriterion = this.criteria[key];
                // [todo] is any? seems like i broke it without realizing during implementation of criterion templates
                const otherBagCriterion = otherBag[key];

                if (myBagCriterion === void 0) {
                    if (otherBagCriterion !== void 0) {
                        return false;
                    }

                    continue;
                } else if (otherBagCriterion === void 0) {
                    return false;
                } else if (ICriterion.is(otherBagCriterion)) {
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

            return this.factory.where(mergedBag);
        } else {
            return false;
        }
    }

    minus(other: ICriterion): boolean | ICriterion {
        throw new Error("Method not implemented.");
    }

    override simplify(): ICriterion {
        const simplifiedWithoutAll = Object.fromEntries(
            Object.entries(this.criteria)
                .map(([key, criterion]) => [key, criterion.simplify()])
                .filter(([, criterion]) => !this.factory.isAllCriterion(criterion))
        );

        if (!Object.keys(simplifiedWithoutAll).length) {
            return this.factory.all();
        }

        return this.factory.where(simplifiedWithoutAll);
    }

    subtractFrom(other: ICriterion): boolean | ICriterion {
        if (IOrCriterion.is(other) || IAndCriterion.is(other)) {
            return other.minus(this);
        } else if (IEntityCriteria.is(other)) {
            // same reduction mechanics as found in and-criteria.ts
            const otherBag = other.getCriteria();
            const reductions: (
                | {
                      result: ICriterion | true;
                      key: string;
                      inverted?: never;
                  }
                | {
                      result: false;
                      key: string;
                      inverted: ICriterion;
                  }
            )[] = [];

            for (const key in this.criteria) {
                const mine = this.criteria[key];

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

            const accumulator: Record<string, ICriterion> = { ...other.getCriteria() };
            const built: Record<string, ICriterion>[] = [];

            for (const { key, result, inverted } of reductions) {
                if (result === true) {
                    continue;
                } else if (result === false) {
                    built.push({ ...accumulator, [key]: inverted });
                    accumulator[key] = this.criteria[key]!;
                } else {
                    built.push({ ...accumulator, [key]: result });
                    accumulator[key] = this.criteria[key]!;
                }
            }

            return built.length === 1
                ? this.factory.where(built[0])
                : this.factory.or(built.map(bag => this.factory.where(bag)));
        }

        return false;
    }

    override toString(): string {
        return `{ ${Object.entries(this.criteria)
            .map(([key, criterion]) => `${key}: ${criterion.toString()}`)
            .join(", ")} }`;
    }

    static omitSelection(
        criterion: ICriterion,
        selection: UnpackedEntitySelection,
        factory: IEntityCriteriaFactory
    ): ICriterion {
        if (IOrCriterion.is(criterion)) {
            const omitted = criterion
                .getCriteria()
                .map(criterion => this.omitSelection(criterion, selection, factory))
                .filter(criterion => !IAllCriterion.is(criterion));

            if (omitted.length == 0) {
                return factory.all();
            } else {
                return factory.or(omitted);
            }
        } else if (IAndCriterion.is(criterion)) {
            const omitted = criterion
                .getCriteria()
                .map(criterion => this.omitSelection(criterion, selection, factory))
                .filter(criterion => !IAllCriterion.is(criterion));

            if (omitted.length == 0) {
                return factory.all();
            } else {
                return factory.and(omitted);
            }
        } else if (IEntityCriteria.is(criterion)) {
            const omittedBag: Record<string, ICriterion> = { ...criterion.getCriteria() };

            for (const key in selection) {
                const selectionItem = selection[key];

                if (selectionItem === true) {
                    delete omittedBag[key];
                } else if (selectionItem) {
                    const bagItem = omittedBag[key];

                    if (IEntityCriteria.is(bagItem)) {
                        const omitted = this.omitSelection(bagItem, selectionItem, factory);

                        if (IAllCriterion.is(omitted)) {
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
                return factory.where(omittedBag);
            } else {
                return factory.all();
            }
        } else {
            return criterion;
        }
    }
}
