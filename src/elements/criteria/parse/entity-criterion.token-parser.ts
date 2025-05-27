import { TokenType } from "@entity-space/lexer";
import { Criterion } from "../criterion";
import { EntityCriterion } from "../entity-criterion";
import { criteriaTokenParser } from "./criteria.token-parser";
import { CriterionTokenParser } from "./criterion-token-parser.type";

export function* entityCriterionTokenParser(): CriterionTokenParser {
    let token = yield;

    if (!(token.type === TokenType.Special && token.value === "{")) {
        return false;
    }

    const bag: Record<string, Criterion> = {};

    while (true) {
        token = yield;

        if (token.type === TokenType.Special && token.value === "}" && !Object.keys(bag).length) {
            return () => new EntityCriterion({});
        } else if (token.type !== TokenType.Literal) {
            return false;
        }

        const propertyName = token.value;

        token = yield;

        if (!(token.type === TokenType.Special && token.value === ":")) {
            return false;
        }

        const criterionTokenParser = criteriaTokenParser(false);
        criterionTokenParser.next();

        while (true) {
            token = yield;

            const result = criterionTokenParser.next(token);

            if (result.value === false) {
                return false;
            } else if (result.done && result.value !== undefined) {
                bag[propertyName] = result.value();

                if (token.type === TokenType.Special && token.value === "}") {
                    return () => new EntityCriterion(bag);
                } else if (!(token.type === TokenType.Special && token.value === ",")) {
                    return false;
                } else {
                    break;
                }
            }
        }
    }
}
