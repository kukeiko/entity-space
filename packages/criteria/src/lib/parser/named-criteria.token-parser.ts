import { TokenType } from "@entity-space/lexer";
import { Criterion } from "../criterion/criterion";
import { matches } from "../criterion/named/matches.fn";
import { CriterionTokenParser } from "./criterion-token-parser.type";
import { noBracketsCriteriaTokenParser } from "./no-brackets-criteria.token-parser";

export function* namedCriteriaTokenParser(): CriterionTokenParser {
    let token = yield;

    if (!(token.type === TokenType.Special && token.value === "{")) {
        return false;
    }

    const bag: Record<string, Criterion> = {};

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

        const criterionTokenParser = noBracketsCriteriaTokenParser();
        criterionTokenParser.next();

        while (true) {
            token = yield;

            const result = criterionTokenParser.next(token);

            if (result.value === false) {
                return false;
            } else if (result.done && result.value !== void 0) {
                bag[propertyName] = result.value();

                if (token.type === TokenType.Special && token.value === "}") {
                    return () => matches(bag);
                } else if (!(token.type === TokenType.Special && token.value === ",")) {
                    return false;
                } else {
                    break;
                }
            }
        }
    }
}