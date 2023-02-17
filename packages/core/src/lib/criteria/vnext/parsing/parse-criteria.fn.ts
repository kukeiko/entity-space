import { lex } from "../../../lexer/lex.fn";
import { IAndCriterion } from "../and/and-criterion.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { IOrCriterion } from "../or/or-criterion.interface";
import { criteriaTokenParser } from "./criteria.token-parser";

export function parseCriteria(tools: IEntityCriteriaTools, input: string): ICriterion {
    let tokens = lex(input);

    if (tokens.length === 0) {
        throw new Error("no tokens provided");
    }

    const generator = criteriaTokenParser(tools, false);
    generator.next();
    let createCriterion: (() => ICriterion) | undefined;

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

        if ((IOrCriterion.is(criterion) || IAndCriterion.is(criterion)) && criterion.getCriteria().length === 1) {
            return criterion.getCriteria()[0];
        }

        return criterion;
    }

    throw new Error("syntax error");
}
