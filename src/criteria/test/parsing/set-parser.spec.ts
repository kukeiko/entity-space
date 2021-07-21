import { parseInSetGenerator, token, TokenType } from "../../parser";
import { inSet, notInSet } from "../../value-criterion";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: in-set / not-in-set", () => {
    itShouldParseTokens(
        parseInSetGenerator,
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
        parseInSetGenerator,
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
