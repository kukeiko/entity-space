import { ValueCriteria, ValueCriterion } from "../value-criterion";
import { lex } from "./lex.fn";
import { parseValueCriteriaGenerator } from "./token-parser";
import { TokenType } from "./token-type.enum";
import { token } from "./token.fn";

export function parseCriteria(input: string): ValueCriterion {
    let tokens = lex(input);

    if (tokens.length === 0) {
        throw new Error("no tokens provided");
    }

    tokens = [token(TokenType.Special, "("), ...tokens, token(TokenType.Special, ")")];
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
