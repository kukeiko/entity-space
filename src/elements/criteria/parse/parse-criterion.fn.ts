import { lex } from "@entity-space/lexer";
import { Criterion } from "../criterion";
import { criteriaTokenParser } from "./criteria.token-parser";

export function parseCriterion(input: string): Criterion {
    const tokens = lex(input);

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
        } else if (result.value !== undefined) {
            createCriterion = result.value;
        }

        if (result.done) {
            break;
        }
    }

    if (createCriterion !== undefined) {
        return createCriterion();
    }

    throw new Error("syntax error");
}
