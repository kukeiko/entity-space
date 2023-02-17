import { TokenType } from "../../../lexer/token-type.enum";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { CriterionTokenParser } from "./criterion-token-parser.type";

const binaryCriterionMapping: Record<string, (tools: IEntityCriteriaTools, truthy: boolean) => ICriterion> = {
    true: (factory, truthy) => (truthy ? factory.equals(true) : factory.notEquals(true)),
    false: (factory, truthy) => (truthy ? factory.equals(false) : factory.notEquals(false)),
    null: (factory, truthy) => (truthy ? factory.equals(null) : factory.notEquals(null)),
    even: (factory, truthy) => (truthy ? factory.isEven() : factory.isOdd()),
    odd: (factory, truthy) => (truthy ? factory.isOdd() : factory.isEven()),
};

export function* valueCriterionTokenParser(tools: IEntityCriteriaTools): CriterionTokenParser {
    let token = yield;
    let not = false;

    if (token.type === TokenType.Special && token.value === "!") {
        not = true;
        token = yield;
    }

    if (token.type === TokenType.String) {
        return () => (not ? tools.notEquals(token.value) : tools.equals(token.value));
    } else if (token.type === TokenType.Number) {
        return () => (not ? tools.notEquals(parseFloat(token.value)) : tools.equals(parseFloat(token.value)));
    } else if (token.type === TokenType.Literal) {
        const mapping = binaryCriterionMapping[token.value];

        if (mapping !== void 0) {
            return () => mapping(tools, !not);
        }
    }

    return false;
}
