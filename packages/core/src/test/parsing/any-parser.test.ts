import { token, TokenType } from "@entity-space/lexer";
import { any } from "../../lib/criteria/criterion/any/any.fn";
import { anyCriterionTokenParser } from "../../lib/criteria/parser/any-criterion.token-parser";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: any", () => {
    itShouldParseTokens(anyCriterionTokenParser, [token(TokenType.Literal, "any")], any());
});
