import { and, or, ValueCriterion } from "../../value-criterion";
import { TokenType } from "../token-type.enum";
import { Token } from "../token.contract";
import { ParseTokenGenerator } from "./parse-token-generator.type";
import { parseValueCriterionGenerator } from "./parse-value-criterion.generator";

export function* parseValueCriteriaGenerator(parseAsRoot = false): ParseTokenGenerator {
    if (!parseAsRoot) {
        // not parsing as root means that we expect an opening parens
        let token = yield;

        if (!(token.type === TokenType.Special && token.value === "(")) {
            return false;
        }
    }

    let items: ValueCriterion[] = [];
    let valueResult = yield* parseValueCriterionGenerator();

    if (valueResult === false) {
        return false;
    } else {
        items.push(valueResult());
    }

    let combinator = "|";
    let token: Token;

    if (!parseAsRoot) {
        token = yield;
    } else {
        token = yield () => (combinator === "|" ? or(items) : and(items));
    }

    const isClosingParens = token.type === TokenType.Special && token.value === ")";

    if (parseAsRoot && isClosingParens) {
        return false;
    } else if (isClosingParens) {
        return () => (combinator === "|" ? or(items) : and(items));
    } else if (token.type === TokenType.Combinator) {
        combinator = token.value;
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
        let valueResult = yield* parseValueCriterionGenerator();

        if (valueResult === false) {
            return false;
        } else {
            items.push(valueResult());
        }

        if (!parseAsRoot) {
            token = yield;
        } else {
            token = yield () => (combinator === "|" ? or(items) : and(items));
        }

        const isClosingParens = token.type === TokenType.Special && token.value === ")";

        if (parseAsRoot && isClosingParens) {
            return false;
        } else if (isClosingParens) {
            return () => (combinator === "|" ? or(items) : and(items));
        } else if (token.type === TokenType.Combinator) {
            combinator = token.value;
        }
    }
}
