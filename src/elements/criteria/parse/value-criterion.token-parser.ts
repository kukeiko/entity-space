import { TokenType } from "@entity-space/lexer";
import { Criterion } from "../criterion";
import { EqualsCriterion } from "../equals-criterion";
import { NotEqualsCriterion } from "../not-equals-criterion";
import { CriterionTokenParser } from "./criterion-token-parser.type";

const valueMap: Record<string, (truthy: boolean) => Criterion> = {
    true: truthy => (truthy ? new EqualsCriterion(true) : new NotEqualsCriterion(true)),
    false: truthy => (truthy ? new EqualsCriterion(false) : new NotEqualsCriterion(false)),
    null: truthy => (truthy ? new EqualsCriterion(null) : new NotEqualsCriterion(null)),
    undefined: truthy => (truthy ? new EqualsCriterion(undefined) : new NotEqualsCriterion(undefined)),
};

export function* valueCriterionTokenParser(): CriterionTokenParser {
    let token = yield;
    let not = false;

    if (token.type === TokenType.Special && token.value === "!") {
        not = true;
        token = yield;
    }

    if (token.type === TokenType.String) {
        return () => (not ? new NotEqualsCriterion(token.value) : new EqualsCriterion(token.value));
    } else if (token.type === TokenType.Number) {
        return () =>
            not ? new NotEqualsCriterion(parseFloat(token.value)) : new EqualsCriterion(parseFloat(token.value));
    } else if (token.type === TokenType.Literal) {
        const mapping = valueMap[token.value];

        if (mapping !== undefined) {
            return () => mapping(!not);
        }
    }

    return false;
}
