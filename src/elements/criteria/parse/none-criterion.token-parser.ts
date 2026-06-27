import { TokenType } from "@entity-space/lexer";
import { Criterion } from "../criterion";
import { NoneCriterion } from "../none-criterion";
import { criteriaTokenParser } from "./criteria.token-parser";
import { CriterionTokenParser } from "./criterion-token-parser.type";

export function* noneCriterionTokenParser(): CriterionTokenParser {
    let token = yield;

    if (!(token.type === TokenType.Literal && token.value === "none")) {
        return false;
    }

    token = yield;

    if (!(token.type === TokenType.Special && token.value === "(")) {
        return false;
    }

    let criterion: Criterion;

    while (true) {
        const criterionTokenParser = criteriaTokenParser(false);
        criterionTokenParser.next();

        while (true) {
            token = yield;
            const result = criterionTokenParser.next(token);

            if (result.value === false) {
                return false;
            } else if (result.done && result.value !== undefined) {
                criterion = result.value();

                if (token.type === TokenType.Special && token.value === ")") {
                    return () => new NoneCriterion(criterion);
                } else {
                    return false;
                }
            }
        }
    }
}
