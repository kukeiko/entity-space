import { lex } from "@entity-space/lexer";
import { Criteria } from "../criterion/criteria";
import { Criterion } from "../criterion/criterion";
import { noBracketsCriteriaTokenParser } from "./no-brackets-criteria.token-parser";

export function parseCriteria(input: string): Criterion {
    let tokens = lex(input);

    if (tokens.length === 0) {
        throw new Error("no tokens provided");
    }

    const generator = noBracketsCriteriaTokenParser();
    generator.next();
    let createCriterion: (() => Criterion) | undefined;

    for (const token of tokens) {
        const result = generator.next(token);

        if (result.value === false) {
            throw new Error(`syntax error, token: ${JSON.stringify(token)}`);
        } else if (result.value !== void 0) {
            createCriterion = result.value;
        }

        if (result.done) {
            break;
        }
    }

    if (createCriterion !== void 0) {
        const criterion = createCriterion();

        if (criterion instanceof Criteria && criterion.getItems().length === 1) {
            return criterion.getItems()[0];
        }

        return criterion;
    }

    throw new Error("syntax error");
}
