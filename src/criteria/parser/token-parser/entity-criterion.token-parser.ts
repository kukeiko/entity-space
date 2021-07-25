import { EntityCriterion, Criterion } from "../../value-criterion";
import { TokenType } from "../token-type.enum";
import { notBracketedCriteriaTokenParser } from "./not-bracketed-criteria.token-parser";
import { TokenParser } from "./token-parser.type";

export function* entityCriterionTokenParser(): TokenParser {
    let token = yield;

    if (!(token.type === TokenType.Special && token.value === "{")) {
        return false;
    }

    const bag: Record<string, Criterion> = {};

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

        const orCombinedCriteriaGenerator = notBracketedCriteriaTokenParser();
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
