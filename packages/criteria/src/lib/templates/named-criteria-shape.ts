import { permutateEntries } from "@entity-space/utils";
import { Criterion } from "../criterion/criterion";
import { NamedCriteria } from "../criterion/named/named-criteria";
import { OrCriteria } from "../criterion/or/or-criteria";
import { ICriterionShape } from "./criterion-shape.interface";
import { InstancedCriterionShape } from "./instanced-criterion-shape.type";
import { ReshapedCriterion } from "./reshaped-criterion";
import { reshapeOrCriteria } from "./reshape-or-criteria.fn";

function looksLikeShape(value: any): value is ICriterionShape {
    return (value as any as ICriterionShape)?.reshape instanceof Function;
}

export type NamedCriteriaShapeItems = { [key: string]: ICriterionShape };

export type InstancedNamedCriteriaShapeItems<T extends NamedCriteriaShapeItems> = {
    [K in keyof T]?: InstancedCriterionShape<T[K]>;
};

export class NamedCriteriaShape<
    T extends NamedCriteriaShapeItems = NamedCriteriaShapeItems,
    U extends NamedCriteriaShapeItems = {}
> implements ICriterionShape<NamedCriteria<InstancedNamedCriteriaShapeItems<T & U>, keyof T>>
{
    constructor(items: T, optionalItems?: U) {
        this.requiredItems = items;
        this.optionalItems = optionalItems ?? ({} as U);
    }

    private readonly requiredItems: T;
    private readonly optionalItems: U;

    getRequiredItems(): T {
        return this.requiredItems;
    }

    getOptionalitems(): U {
        return this.optionalItems;
    }

    // [todo] have a look if we can get rid of any & other casts
    // [todo] implement AndCriteria
    reshape(
        criterion: Criterion
    ): false | ReshapedCriterion<NamedCriteria<InstancedNamedCriteriaShapeItems<T & U>, keyof T>> {
        if (criterion instanceof NamedCriteria) {
            const criterionItems = criterion.getBag();
            const itemsToPermutate: Record<string, any> = {};
            const openItems: Record<string, Criterion[]> = {};

            for (const key in this.requiredItems) {
                const criterionItem = criterionItems[key];

                if (criterionItem === void 0) {
                    return false;
                }

                const itemTemplate = this.requiredItems[key];
                const result = itemTemplate.reshape(criterionItem);

                if (result === false) {
                    return false;
                }

                itemsToPermutate[key] = result.getReshaped();

                if (result.getOpen().length > 0) {
                    openItems[key] = result.getOpen();
                }
            }

            for (const key in this.optionalItems) {
                const criterionItem = criterionItems[key];

                if (criterionItem === void 0) {
                    continue;
                }

                const itemTemplate = this.optionalItems[key];
                const result = itemTemplate.reshape(criterionItem);

                if (result === false || result.getOpen().length > 0) {
                    continue;
                }

                itemsToPermutate[key] = result.getReshaped();
            }

            if (Object.keys(itemsToPermutate).length > 0) {
                const permutations = permutateEntries(itemsToPermutate) as InstancedNamedCriteriaShapeItems<T & U>[];
                const namedCriteria = permutations.map(
                    items => new NamedCriteria(items) as NamedCriteria<InstancedNamedCriteriaShapeItems<T & U>, keyof T>
                );

                const open: Criterion[] = [];

                if (Object.keys(openItems).length > 0) {
                    for (const key in openItems) {
                        open.push(
                            new NamedCriteria({
                                ...criterionItems,
                                [key]: new OrCriteria(openItems[key]),
                            })
                        );
                    }
                }

                return new ReshapedCriterion(namedCriteria, open);
            }
        } else if (criterion instanceof OrCriteria) {
            const result = reshapeOrCriteria(this, criterion);

            if (result !== false) {
                return result;
            }
        }

        return false;
    }

    matches(criterion: Criterion): criterion is NamedCriteria<InstancedNamedCriteriaShapeItems<T & U>, keyof T> {
        if (!(criterion instanceof NamedCriteria)) {
            return false;
        }

        const criterionItems = criterion.getBag();

        for (const key in this.requiredItems) {
            if (criterionItems[key] === void 0) {
                return false;
            }

            const itemTemplate = this.requiredItems[key];

            if (!itemTemplate.matches(criterionItems[key])) {
                return false;
            }
        }

        for (const key in this.optionalItems) {
            if (criterionItems[key] === void 0) {
                continue;
            }

            const itemTemplate = this.optionalItems[key];

            if (!itemTemplate.matches(criterionItems[key])) {
                return false;
            }
        }

        return true;
    }

    toString(): string {
        return `{ ${[
            ...Object.entries(this.requiredItems).map(([key, value]) => `${key}: ${value.toString()}`),
            ...Object.entries(this.optionalItems).map(([key, value]) => `${key}?: ${value.toString()}`),
        ].join(", ")} }`;
    }

    static fromDeepBag(deepBag: Record<string, any>): NamedCriteriaShape {
        const bag: NamedCriteriaShapeItems = {};

        for (const key in deepBag) {
            const value = deepBag[key];

            if (looksLikeShape(value)) {
                bag[key] = value;
            } else {
                bag[key] = this.fromDeepBag(value);
            }
        }

        return new NamedCriteriaShape(bag);
    }

    static fromRequiredAndOptionalDeepBags(
        requiredDeepBag: Record<string, any>,
        optionalDeepBag: Record<string, any>
    ): NamedCriteriaShape {
        const requiredBag: NamedCriteriaShapeItems = {};

        for (const key in requiredDeepBag) {
            const value = requiredDeepBag[key];

            if (looksLikeShape(value)) {
                requiredBag[key] = value;
            } else {
                requiredBag[key] = this.fromDeepBag(value);
            }
        }

        const optionalBag: NamedCriteriaShapeItems = {};

        for (const key in optionalDeepBag) {
            const value = optionalDeepBag[key];

            if (looksLikeShape(value)) {
                optionalBag[key] = value;
            } else {
                optionalBag[key] = this.fromDeepBag(value);
            }
        }

        return new NamedCriteriaShape(requiredBag, optionalBag);
    }
}
