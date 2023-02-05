import { NamedCriteria } from "../../criteria/criterion/named/named-criteria";

function namedCriteriaToKeyPathsInternal(namedCriteria: NamedCriteria, prefix: string[]): string[] {
    const bagKeyPaths: string[] = [];
    const bag = namedCriteria.getBag();

    for (const property in bag) {
        const criterionInBag = bag[property];

        if (criterionInBag instanceof NamedCriteria) {
            bagKeyPaths.push(...namedCriteriaToKeyPathsInternal(criterionInBag, [...prefix, property]));
        } else {
            bagKeyPaths.push([...prefix, property].join("."));
        }
    }

    return bagKeyPaths;
}

// [todo] move to criteria folder :?
// [todo] not used. did it get replaced by something so it can be removed?
export function namedCriteriaToKeyPaths(namedCriteria: NamedCriteria): string[] {
    return namedCriteriaToKeyPathsInternal(namedCriteria, []);
}
