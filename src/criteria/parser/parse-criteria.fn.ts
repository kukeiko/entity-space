import { Criteria, Criterion } from "../value-criterion";
import { lex } from "./lex.fn";
import { notBracketedCriteriaTokenParser } from "./token-parser";
import { TokenType } from "./token-type.enum";
import { token } from "./token.fn";

export function parseCriteria(input: string): Criterion {
    let tokens = lex(input);

    if (tokens.length === 0) {
        throw new Error("no tokens provided");
    }

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
