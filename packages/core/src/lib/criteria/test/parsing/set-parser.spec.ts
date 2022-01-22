import { token, TokenType } from "@entity-space/lexer";
import { inSet, notInSet } from "../../criterion";
import { insetCriterionTokenParser } from "../../parser";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: in-set / not-in-set", () => {
    itShouldParseTokens(
        insetCriterionTokenParser,
        [
            token(TokenType.Special, "{"),
            token(TokenType.Number, "1"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "2"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "3"),
            token(TokenType.Special, "}"),
        ],
        inSet([1, 2, 3])
    );

    itShouldParseTokens(
        insetCriterionTokenParser,
        [
            token(TokenType.Special, "!"),
            token(TokenType.Special, "{"),
            token(TokenType.Number, "1"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "2"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "3"),
            token(TokenType.Special, "}"),
        ],
        notInSet([1, 2, 3])
    );
});
