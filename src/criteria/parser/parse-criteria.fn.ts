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

    // tokens = [token(TokenType.Special, "("), ...tokens, token(TokenType.Special, ")")];

    const generator = parseValueCriteriaGenerator(true);
    generator.next();

    let intermediateResult: (() => ValueCriterion) | undefined;

    for (const token of tokens) {
        const result = generator.next(token);

        if (result.value === false) {
            throw new Error(`syntax error, probably - token: ${token}`);
        } else if (result.value !== undefined) {
            if (result.done) {
                const criterion = result.value();
                if (criterion instanceof ValueCriteria) {
                    if (criterion.getItems().length === 1) {
                        return criterion.getItems()[0];
                    }
                }

                return criterion;
            } else {
                intermediateResult = result.value;
            }
        }
    }

    if (intermediateResult !== void 0) {
        const criterion = intermediateResult();

        if (criterion instanceof ValueCriteria) {
            if (criterion.getItems().length === 1) {
                return criterion.getItems()[0];
            }
        }

        return criterion;
    }

    throw new Error("syntax error, probably");
}
