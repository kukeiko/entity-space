import { TokenType } from "@entity-space/lexer";
import { any } from "../criterion/any/any.fn";
import { CriterionTokenParser } from "./criterion-token-parser.type";

export function* anyCriterionTokenParser(): CriterionTokenParser {
    let token = yield;

    if (token.type === TokenType.Literal && token.value === "any") {
        return () => any();
    }

    return false;
}