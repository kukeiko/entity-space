import { lex, token, TokenType } from "@entity-space/lexer";
import { Criteria } from "../criterion/criteria";
import { Criterion } from "../criterion/criterion";
import { notBracketedCriteriaTokenParser } from "./token-parser";

export function parseCriteria(input: string): Criterion {
    let tokens = lex(input);

    if (tokens.length === 0) {
        throw new Error("no tokens provided");
    }

    // [todo] this seems like a fishy workaround. try to get rid of it
    const terminator = token(TokenType.Special, ";");
    tokens.push(terminator);

    const generator = notBracketedCriteriaTokenParser();
    generator.next();

    for (const token of tokens) {
        const result = generator.next(token);

        if (result.value === false) {
            throw new Error(`syntax error, token: ${JSON.stringify(token)}`);
        } else if (result.value !== undefined && result.done) {
            const criterion = result.value();

            if (criterion instanceof Criteria) {
                if (criterion.getItems().length === 1) {
                    return criterion.getItems()[0];
                }
            }

            return criterion;
        }
    }

    throw new Error("syntax error");
}
