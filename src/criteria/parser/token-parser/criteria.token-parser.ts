import { and, or, ValueCriterion } from "../../value-criterion";
import { TokenType } from "../token-type.enum";
import { TokenParser } from "./token-parser.type";
import { criterionTokenParser } from "./criterion.token-parser";

export function* criteriaTokenParser(): TokenParser {
    let token = yield;

    if (!(token.type === TokenType.Special && token.value === "(")) {
        return false;
    }

    const items: ValueCriterion[] = [];
    let combinator = "|";

    while (true) {
        let valueResult = yield* criterionTokenParser();

        if (valueResult === false) {
            return false;
        } else {
            items.push(valueResult());
        }

        token = yield;

        if (token.type === TokenType.Special && token.value === ")") {
            return () => (items.length === 1 ? items[0] : combinator === "|" ? or(items) : and(items));
        } else if (token.type === TokenType.Combinator) {
            combinator = token.value;
        }
    }
}
