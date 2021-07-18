import { ValueCriterion } from "../value-criterion";
import { lex } from "./lex.fn";
import { ValueCriteriaTokenParser } from "./token-parser";
import { TokenType } from "./token-type.enum";

export function parseCriteria(input: string): ValueCriterion {
    let tokens = lex(input);

    if (tokens.length === 0) {
        throw new Error("no tokens provided");
    }

    tokens = [{ type: TokenType.Special, value: "(" }, ...tokens, { type: TokenType.Special, value: ")" }];
    const parser = new ValueCriteriaTokenParser();

    for (const token of tokens) {
        if (!parser.accept(token)) {
            throw new Error("syntax error, probably");
        }

        if (parser.isComplete()) {
            const result = parser.getResult();

            if (result.getItems().length === 1) {
                return result.getItems()[0];
            }

            return result;
        }
    }

    throw new Error("syntax error, probably");
}
