import { ValueCriteria, ValueCriterion } from "../value-criterion";
import { lex } from "./lex.fn";
import { parseValueCriteriaGenerator } from "./token-parser";
import { TokenType } from "./token-type.enum";

export function parseCriteria(input: string): ValueCriterion {
    let tokens = lex(input);

    if (tokens.length === 0) {
        throw new Error("no tokens provided");
    }

    tokens = [{ type: TokenType.Special, value: "(" }, ...tokens, { type: TokenType.Special, value: ")" }];
    const generator = parseValueCriteriaGenerator();
    generator.next();

    for (const token of tokens) {
        const result = generator.next(token);

        if (result.value === false) {
            throw new Error(`syntax error, probably - token: ${token}`);
        } else if (result.value !== true && result.value instanceof ValueCriteria) {
            if (result.value.getItems().length === 1) {
                return result.value.getItems()[0];
            }

            return result.value;
        }
    }

    throw new Error("syntax error, probably");
}
