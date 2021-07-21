import { and, or, ValueCriterion } from "../../value-criterion";
import { TokenType } from "../token-type.enum";
import { ParseTokenGenerator } from "./parse-token-generator.type";
import { parseValueCriterionGenerator } from "./parse-value-criterion.generator";

export function* parseNotBracketedCriteriaGenerator(): ParseTokenGenerator {
    const items: ValueCriterion[] = [];

    let combinator = "|";

    while (true) {
        let valueResult = yield* parseValueCriterionGenerator();

        if (valueResult === false) {
            return false;
        } else {
            items.push(valueResult());
        }

        let token = yield;

        if (token.type === TokenType.Special && token.value === ")") {
            return false;
        } else if (token.type === TokenType.Combinator) {
            combinator = token.value;
        } else {
            return () => (combinator === "|" ? or(items) : and(items));
        }
    }
}
