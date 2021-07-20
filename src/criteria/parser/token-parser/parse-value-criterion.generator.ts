import { ValueCriterion } from "../../value-criterion";
import { parseInRangeGenerator } from "./parse-in-range.generator";
import { parseInSetGenerator } from "./parse-in-set.generator";
import { ParseTokenGenerator } from "./parse-token-generator.type";
import { parseValueCriteriaGenerator } from "./parse-value-criteria.generator";

export function* parseValueCriterionGenerator(): ParseTokenGenerator {
    let generators = [parseValueCriteriaGenerator(), parseInRangeGenerator(), parseInSetGenerator()];
    generators.forEach(generator => generator.next());

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const token = yield true;

        for (const generator of generators.slice()) {
            const result = generator.next(token);

            if (result.value === false) {
                generators = generators.filter(gen => gen !== generator);
            } else if (result.value instanceof ValueCriterion) {
                return result.value;
            }

            if (generators.length === 0) {
                return false;
            }
        }
    }
}
