import { TokenType } from "../../lexer/token-type.enum";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { criteriaTokenParser } from "./criteria.token-parser";
import { CriterionTokenParser } from "./criterion-token-parser.type";

export function* namedCriteriaTokenParser(tools: IEntityCriteriaTools): CriterionTokenParser {
    let token = yield;

    if (!(token.type === TokenType.Special && token.value === "{")) {
        return false;
    }

    const bag: Record<string, ICriterion> = {};

    while (true) {
        token = yield;

        if (token.type !== TokenType.Literal) {
            return false;
        }

        const propertyName = token.value;

        token = yield;

        if (!(token.type === TokenType.Special && token.value === ":")) {
            return false;
        }

        const criterionTokenParser = criteriaTokenParser(tools, false);
        criterionTokenParser.next();

        while (true) {
            token = yield;

            const result = criterionTokenParser.next(token);

            if (result.value === false) {
                return false;
            } else if (result.done && result.value !== void 0) {
                bag[propertyName] = result.value();

                if (token.type === TokenType.Special && token.value === "}") {
                    return () => tools.where(bag);
                } else if (!(token.type === TokenType.Special && token.value === ",")) {
                    return false;
                } else {
                    break;
                }
            }
        }
    }
}
