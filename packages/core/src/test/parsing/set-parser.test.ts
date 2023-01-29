import { token, TokenType } from "@entity-space/lexer";
import { inSet } from "../../lib/criteria/criterion/set/in-set.fn";
import { notInSet } from "../../lib/criteria/criterion/set/not-in-set.fn";
import { setCriterionTokenParser } from "../../lib/criteria/parser/set-criterion.token-parser";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: in-set / not-in-set", () => {
    itShouldParseTokens(
        setCriterionTokenParser,
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
        setCriterionTokenParser,
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

    itShouldParseTokens(
        setCriterionTokenParser,
        [
            token(TokenType.Special, "{"),
            token(TokenType.Literal, "true"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "2"),
            token(TokenType.Special, ","),
            token(TokenType.String, "null"),
            token(TokenType.Special, "}"),
        ],
        inSet([true, 2, "null"])
    );
});
