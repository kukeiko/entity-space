import { parseInRangeGenerator, token, TokenType } from "../../parser";
import { inRange } from "../../value-criterion";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: in-range", () => {
    itShouldParseTokens(
        parseInRangeGenerator,
        [token(TokenType.Special, "("), token(TokenType.Number, "13"), token(TokenType.Special, ","), token(TokenType.Number, "37"), token(TokenType.Special, "]")],
        inRange(13, 37, [false, true])
    );

    itShouldParseTokens(
        parseInRangeGenerator,
        [
            token(TokenType.Special, "["),
            token(TokenType.Special, "."),
            token(TokenType.Special, "."),
            token(TokenType.Special, "."),
            token(TokenType.Special, ","),
            token(TokenType.Number, "7"),
            token(TokenType.Special, "]"),
        ],
        inRange(void 0, 7)
    );

    itShouldParseTokens(
        parseInRangeGenerator,
        [
            token(TokenType.Special, "("),
            token(TokenType.Number, "1"),
            token(TokenType.Special, ","),
            token(TokenType.Special, "."),
            token(TokenType.Special, "."),
            token(TokenType.Special, "."),
            token(TokenType.Special, "]"),
        ],
        inRange(1, void 0, false)
    );
});
