import { EntityCriterion, ValueCriterion } from "../../value-criterion";
import { TokenType } from "../token-type.enum";
import { parseNotBracketedCriteriaGenerator } from "./parse-not-bracketed-criteria.generator";
import { ParseTokenGenerator } from "./parse-token-generator.type";

export function* parseEntityCriterionGenerator(): ParseTokenGenerator {
    let token = yield;

    if (!(token.type === TokenType.Special && token.value === "{")) {
        return false;
    }

    const bag: Record<string, ValueCriterion> = {};

    while (true) {
        token = yield;

        if (token.type !== TokenType.Symbol) {
            return false;
        }

        const propertyName = token.value;

        token = yield;

        if (!(token.type === TokenType.Special && token.value === ":")) {
            return false;
        }

        const orCombinedCriteriaGenerator = parseNotBracketedCriteriaGenerator();
        orCombinedCriteriaGenerator.next();

        while (true) {
            token = yield;

            const result = orCombinedCriteriaGenerator.next(token);

            if (result.value === false) {
                return false;
            } else if (result.done && result.value !== void 0) {
                bag[propertyName] = result.value();

                if (token.type === TokenType.Special && token.value === "}") {
                    return () => new EntityCriterion(bag);
                } else if (!(token.type === TokenType.Special && token.value === ",")) {
                    return false;
                } else {
                    break;
                }
            }
        }
    }
}
