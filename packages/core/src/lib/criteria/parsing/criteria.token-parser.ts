import { TokenType } from "../../lexer/token-type.enum";
import { Token } from "../../lexer/token.contract";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { CriterionTokenParser } from "./criterion-token-parser.type";
import { criterionTokenParser } from "./criterion.token-parser";

export function* criteriaTokenParser(
    tools: IEntityCriteriaTools,
    requireBrackets = true,
    endWith?: Token
): CriterionTokenParser {
    if (requireBrackets) {
        let token = yield;

        if (!(token.type === TokenType.Special && token.value === "(")) {
            return false;
        }
    }

    let items: ICriterion[] = [];
    let combinator: "|" | "&" | undefined;
    let andCount = 0;

    const packAndedItems = () => {
        if (andCount == 0) {
            return;
        }

        const andedItems = items.slice(-(andCount + 1));
        items = [...items.slice(0, -(andCount + 1)), tools.and(andedItems)];
        andCount = 0;
    };

    const createCriterion = () => {
        packAndedItems();

        if (items.length === 1 && (!requireBrackets || tools.isAndCriterion(items[0]))) {
            return items[0];
        } else {
            return tools.or(items);
        }
    };

    while (true) {
        let valueResult = yield* criterionTokenParser(tools);

        if (valueResult === false) {
            return false;
        } else {
            items.push(valueResult());
        }

        let token = yield requireBrackets ? void 0 : createCriterion;

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
