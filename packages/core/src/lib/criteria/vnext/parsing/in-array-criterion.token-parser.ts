import { TokenType } from "../../../lexer/token-type.enum";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { CriterionTokenParser } from "./criterion-token-parser.type";

const literalsMap = new Map([
    ["true", true],
    ["false", false],
    ["null", null],
]);

export function* setCriterionTokenParser(factory: IEntityCriteriaFactory): CriterionTokenParser {
    let token = yield;
    let isNegated = false;

    if (token.type === TokenType.Special && token.value === "!") {
        isNegated = true;
        token = yield;
    }

    if (!(token.type === TokenType.Special || token.value === "{")) {
        return false;
    }

    token = yield;

    let items: (string | number | boolean | null)[] = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
        if ([TokenType.Number, TokenType.String, TokenType.Literal].includes(token.type)) {
            if (token.type === TokenType.Literal) {
                const literalValue = literalsMap.get(token.value);

                if (literalValue !== void 0) {
                    items.push(literalValue);
                } else {
                    return false;
                }
            } else {
                items.push(token.type === TokenType.Number ? parseFloat(token.value) : token.value);
            }

            token = yield;

            if (token.type === TokenType.Special && token.value === "}") {
                return () => (isNegated ? factory.notInArray(items) : factory.inArray(items));
            } else if (!(token.type === TokenType.Special && token.value === ",")) {
                return false;
            }

            token = yield;
        } else {
            return false;
        }
    }
}
