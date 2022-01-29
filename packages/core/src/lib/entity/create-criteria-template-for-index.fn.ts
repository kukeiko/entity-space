import { InSetCriterionTemplate, inSetTemplate, matchesTemplate, NamedCriteriaTemplate } from "@entity-space/criteria";
import { chip } from "@entity-space/utils";
import { IEntitySchemaIndex } from "../schema/public";

export function createCriteriaTemplateForIndex(
    index: IEntitySchemaIndex
): NamedCriteriaTemplate<{ [key: string]: InSetCriterionTemplate }> {
    const keyPath = index.getPath();

    if (index.getPath().some(key => key.split(".").length > 2)) {
        // [todo] support arbitrary depth
        throw new Error(`arbitrary depth of nested index paths not yet supported`);
    }

    // [todo] would like to use this line, but need to introduce generic for it.
    // don't wanna do now cause i need to thoroughly check places for "infinitely deep" stuff,
    // and right now im too lazy.
    // const namedBagTemplate: NamedCriteriaBagTemplate = {} ;
    const namedBagTemplate: { [key: string]: any } = {};

    for (const key of keyPath) {
        if (key.includes(".")) {
            // [todo] support more than 1 level of nesting
            const [first, second] = chip(key, ".");

            if (!namedBagTemplate[first]) {
                namedBagTemplate[first] = matchesTemplate({}) as any;
            }

            if (second !== void 0) {
                // [todo] support more than just InNumberSet
                // [todo] cast to any
                (namedBagTemplate[first] as any).items[second] = inSetTemplate(Number);
            }
        } else {
            // [todo] i was a bit suprised that i have to supply an array; was a bit unintuitive
            namedBagTemplate[key] = inSetTemplate(Number);
        }
    }

    return matchesTemplate(namedBagTemplate);
}
