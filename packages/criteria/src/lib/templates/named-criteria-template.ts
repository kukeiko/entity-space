import { permutateEntries } from "@entity-space/utils";
import { Criterion } from "../criterion/criterion";
import { NamedCriteria } from "../criterion/named/named-criteria";
import { OrCriteria } from "../criterion/or/or-criteria";
import { ICriterionTemplate } from "./criterion-template.interface";
import { InstancedCriterionTemplate } from "./instanced-criterion-template.type";
import { RemapCriterionResult } from "./remap-criterion-result";
import { remapOrCriteria } from "./remap-or-criteria.fn";

function looksLikeTemplate(value: any): value is ICriterionTemplate {
    return (value as any as ICriterionTemplate)?.remap instanceof Function;
}

export type NamedCriteriaTemplateItems = { [key: string]: ICriterionTemplate };

export type InstancedNamedCriteriaTemplateItems<T extends NamedCriteriaTemplateItems> = {
    [K in keyof T]?: InstancedCriterionTemplate<T[K]>;
};

export class NamedCriteriaTemplate<
    T extends NamedCriteriaTemplateItems = NamedCriteriaTemplateItems,
    U extends NamedCriteriaTemplateItems = {}
> implements ICriterionTemplate<NamedCriteria<InstancedNamedCriteriaTemplateItems<T & U>, keyof T>>
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
    remap(
        criterion: Criterion
    ): false | RemapCriterionResult<NamedCriteria<InstancedNamedCriteriaTemplateItems<T & U>, keyof T>> {
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
                const result = itemTemplate.remap(criterionItem);

                if (result === false) {
                    return false;
                }

                itemsToPermutate[key] = result.getCriteria();

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
                const result = itemTemplate.remap(criterionItem);

                if (result === false || result.getOpen().length > 0) {
                    continue;
                }

                itemsToPermutate[key] = result.getCriteria();
            }

            if (Object.keys(itemsToPermutate).length > 0) {
                const permutations = permutateEntries(itemsToPermutate) as InstancedNamedCriteriaTemplateItems<T & U>[];
                const namedCriteria = permutations.map(
                    items =>
                        new NamedCriteria(items) as NamedCriteria<InstancedNamedCriteriaTemplateItems<T & U>, keyof T>
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

                return new RemapCriterionResult(namedCriteria, open);
            }
        } else if (criterion instanceof OrCriteria) {
            const result = remapOrCriteria(this, criterion);

            if (result !== false) {
                return result;
            }
        }

        return false;
    }

    matches(criterion: Criterion): criterion is NamedCriteria<InstancedNamedCriteriaTemplateItems<T & U>, keyof T> {
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

    static fromDeepBag(deepBag: Record<string, any>): NamedCriteriaTemplate {
        const bag: NamedCriteriaTemplateItems = {};

        for (const key in deepBag) {
            const value = deepBag[key];

            if (looksLikeTemplate(value)) {
                bag[key] = value;
            } else {
                bag[key] = this.fromDeepBag(value);
            }
        }

        return new NamedCriteriaTemplate(bag);
    }

    static fromRequiredAndOptionalDeepBags(
        requiredDeepBag: Record<string, any>,
        optionalDeepBag: Record<string, any>
    ): NamedCriteriaTemplate {
        const requiredBag: NamedCriteriaTemplateItems = {};

        for (const key in requiredDeepBag) {
            const value = requiredDeepBag[key];

            if (looksLikeTemplate(value)) {
                requiredBag[key] = value;
            } else {
                requiredBag[key] = this.fromDeepBag(value);
            }
        }

        const optionalBag: NamedCriteriaTemplateItems = {};

        for (const key in optionalDeepBag) {
            const value = optionalDeepBag[key];

            if (looksLikeTemplate(value)) {
                optionalBag[key] = value;
            } else {
                optionalBag[key] = this.fromDeepBag(value);
            }
        }

        return new NamedCriteriaTemplate(requiredBag, optionalBag);
    }
}
