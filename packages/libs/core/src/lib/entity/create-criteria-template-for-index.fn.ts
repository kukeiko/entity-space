import { InNumberSetCriterion, NamedCriteriaTemplate } from "../criteria/public";
import { SchemaIndex } from "./metadata/schema-index";

export function createCriteriaTemplateForIndex(
    index: SchemaIndex
): NamedCriteriaTemplate<{ [key: string]: typeof InNumberSetCriterion[] }> {
    const keyPath = index.path;

    if (index.path.some(key => key.split(".").length > 2)) {
        // [todo] support arbitrary depth
        throw new Error(`arbitrary depth of nested index paths not yet supported`);
    }

    // [todo] would like to use this line, but need to introduce generic for it.
    // don't wanna do now cause i need to thoroughly check places for "infinitely deep" stuff,
    // and right now im too lazy.
    // const namedBagTemplate: NamedCriteriaBagTemplate = {} ;
    const namedBagTemplate: { [key: string]: typeof InNumberSetCriterion[] } = {};

    for (const key of keyPath) {
        if (key.includes(".")) {
            // [todo] support more than 1 level of nesting
            const [first, second] = key.split(".");

            if (!namedBagTemplate[first]) {
                namedBagTemplate[first] = [new NamedCriteriaTemplate({})] as any;
            }

            (namedBagTemplate[first][0] as any).items[second] = [InNumberSetCriterion];
        } else {
            // [todo] i was a bit suprised that i have to supply an array; was a bit unintuitive
            namedBagTemplate[key] = [InNumberSetCriterion];
        }
    }

    return new NamedCriteriaTemplate(namedBagTemplate);
}
