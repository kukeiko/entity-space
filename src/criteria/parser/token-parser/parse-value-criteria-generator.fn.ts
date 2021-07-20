import { and, or, ValueCriterion } from "../../value-criterion";
import { TokenType } from "../token-type.enum";
import { ParseTokenGenerator } from "./parse-token-generator.type";
import { parseValueCriterionGenerator } from "./parse-value-criterion-generator.fn";

export function* parseValueCriteriaGenerator(): ParseTokenGenerator {
    let token = yield true;

    if (!(token.type === TokenType.Special && token.value === "(")) {
        return false;
    }

    let items: ValueCriterion[] = [];

    let valueResult = yield* parseValueCriterionGenerator();

    if (valueResult === false) {
        return false;
    } else if (valueResult instanceof ValueCriterion) {
        items.push(valueResult);
    }

    token = yield true;

    let combinator = "|";

    if (token.type === TokenType.Special && token.value === ")") {
        return combinator === "|" ? or(items) : and(items);
    } else if (token.type === TokenType.Combinator) {
        combinator = token.value;
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
        let valueResult = yield* parseValueCriterionGenerator();

        if (valueResult === false) {
            return false;
        } else if (valueResult instanceof ValueCriterion) {
            items.push(valueResult);
        }

        token = yield true;

        if (token.type === TokenType.Special && token.value === ")") {
            return combinator === "|" ? or(items) : and(items);
        } else if (token.type === TokenType.Combinator) {
            combinator = token.value;
        }
    }
}
