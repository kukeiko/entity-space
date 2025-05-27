import { Criterion } from "../criterion";

export function matchesCriterion<T>(criterion: Criterion): (item: T) => boolean {
    return item => criterion.contains(item);
}
