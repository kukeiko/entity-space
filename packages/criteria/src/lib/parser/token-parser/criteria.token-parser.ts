import { TokenType } from "@entity-space/lexer";
import { and, Criterion, or } from "../../criterion";
import { criterionTokenParser } from "./criterion.token-parser";
import { TokenParser } from "./token-parser.type";

export function* criteriaTokenParser(): TokenParser {
    let token = yield;

    if (!(token.type === TokenType.Special && token.value === "(")) {
        return false;
    }

    const items: Criterion[] = [];
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
        } else {
            return false;
        }
    }
}
