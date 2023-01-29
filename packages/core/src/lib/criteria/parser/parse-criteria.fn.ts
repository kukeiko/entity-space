import { lex } from "../../lexer/lex.fn";
import { Criteria } from "../criterion/criteria";
import { Criterion } from "../criterion/criterion";
import { criteriaTokenParser } from "./criteria.token-parser";

export function parseCriteria(input: string): Criterion {
    let tokens = lex(input);

    if (tokens.length === 0) {
        throw new Error("no tokens provided");
    }

    const generator = criteriaTokenParser(false);
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
