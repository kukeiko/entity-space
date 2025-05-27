import { Token, TokenType } from "@entity-space/lexer";
import { AndCriterion } from "../and-criterion";
import { Criterion } from "../criterion";
import { OrCriterion } from "../or-criterion";
import { CriterionTokenParser } from "./criterion-token-parser.type";
import { criterionTokenParser } from "./criterion.token-parser";

export function* criteriaTokenParser(requireBrackets = true, endWith?: Token): CriterionTokenParser {
    if (requireBrackets) {
        let token = yield;

        if (!(token.type === TokenType.Special && token.value === "(")) {
            return false;
        }
    }

    let items: Criterion[] = [];
    let combinator: "|" | "&" | undefined;
    let andCount = 0;

    const packAndedItems = () => {
        if (andCount == 0) {
            return;
        }

        const andedItems = items.slice(-(andCount + 1));
        items = [...items.slice(0, -(andCount + 1)), new AndCriterion(andedItems)];
        andCount = 0;
    };

    const createCriterion = () => {
        packAndedItems();

        if (items.length === 1 && (!requireBrackets || items[0] instanceof AndCriterion)) {
            return items[0];
        } else {
            return new OrCriterion(items);
        }
    };

    while (true) {
        let valueResult = yield* criterionTokenParser();

        if (valueResult === false) {
            return false;
        } else {
            items.push(valueResult());
        }

        let token = yield requireBrackets ? undefined : createCriterion;

        if (requireBrackets && token.type === TokenType.Special && token.value === ")") {
            return createCriterion;
        } else if (token.type === TokenType.Combinator) {
            if (token.value === "|") {
                if (combinator === "&") {
                    packAndedItems();
                }

                combinator = token.value;
            } else if (token.value === "&") {
                andCount++;
                combinator = token.value;
            } else {
                return false;
            }
        } else if (!requireBrackets) {
            return createCriterion;
        } else if (endWith && token.type === endWith.type && token.value === endWith.value) {
            return createCriterion;
        } else {
            return false;
        }
    }
}
