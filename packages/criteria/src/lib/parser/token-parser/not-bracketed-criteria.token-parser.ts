import { TokenType } from "@entity-space/lexer";
import { and } from "../../criterion/and/and.fn";
import { Criterion } from "../../criterion/criterion";
import { or } from "../../criterion/or/or.fn";
import { criterionTokenParser } from "./criterion.token-parser";
import { TokenParser } from "./token-parser.type";

export function* notBracketedCriteriaTokenParser(): TokenParser {
    const items: Criterion[] = [];

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
