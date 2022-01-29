import { permutateEntries } from "@entity-space/utils";
import { Criterion } from "../criterion/criterion";
import { NamedCriteria } from "../criterion/named/named-criteria";
import { OrCriteria } from "../criterion/or/or-criteria";
import { ICriterionTemplate } from "./criterion-template.interface";
import { InstancedCriterionTemplate } from "./instanced-criterion-template.type";
import { RemapCriterionResult } from "./remap-criterion-result";
import { remapOrCriteria } from "./remap-or-criteria.fn";

export type NamedCriteriaTemplateItems = { [key: string]: ICriterionTemplate };

export type InstancedNamedCriteriaTemplateItems<T extends NamedCriteriaTemplateItems> = {
    [K in keyof T]?: InstancedCriterionTemplate<T[K]>;
};

export class NamedCriteriaTemplate<T extends NamedCriteriaTemplateItems>
    implements ICriterionTemplate<NamedCriteria<InstancedNamedCriteriaTemplateItems<T>>>
{
    constructor(items: T) {
        this.items = items;
    }

    private readonly items: T;

    getItems(): T {
        return this.items;
    }

    // [todo] have a look if we can get rid of any & other casts
    remap(criterion: Criterion): false | RemapCriterionResult<NamedCriteria<InstancedNamedCriteriaTemplateItems<T>>> {
        if (criterion instanceof NamedCriteria) {
            const criterionItems = criterion.getBag();
            const itemsToPermutate: Record<string, any> = {};
            const openItems: Record<string, Criterion[]> = {};

            for (const key in this.items) {
                const criterionItem = criterionItems[key];

                if (criterionItem === void 0) {
                    continue;
                }

                const itemTemplate = this.items[key];
                const result = itemTemplate.remap(criterionItem);

                if (result === false) {
                    continue;
                }

                itemsToPermutate[key] = result.getCriteria();

                if (result.getOpen().length > 0) {
                    openItems[key] = result.getOpen();
                }
            }

            if (Object.keys(itemsToPermutate).length > 0) {
                const permutations = permutateEntries(itemsToPermutate) as InstancedNamedCriteriaTemplateItems<T>[];
                const namedCriteria = permutations.map(items => new NamedCriteria(items));

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
}
