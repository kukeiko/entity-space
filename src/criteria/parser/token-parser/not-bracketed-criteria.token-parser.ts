import { and, or, ValueCriterion } from "../../value-criterion";
import { TokenType } from "../token-type.enum";
import { TokenParser } from "./token-parser.type";
import { criterionTokenParser } from "./criterion.token-parser";

export function* notBracketedCriteriaTokenParser(): TokenParser {
    const items: ValueCriterion[] = [];

    let combinator = "|";

    while (true) {
        let valueResult = yield* criterionTokenParser();

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
            return () => (items.length === 1 ? items[0] : combinator === "|" ? or(items) : and(items));
        }
    }
}
