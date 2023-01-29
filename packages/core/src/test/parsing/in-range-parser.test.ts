import { inRange } from "../../lib/criteria/criterion/range/in-range.fn";
import { inRangeCriterionTokenParser } from "../../lib/criteria/parser/in-range-criterion.token-parser";
import { TokenType } from "../../lib/lexer/token-type.enum";
import { token } from "../../lib/lexer/token.fn";
import { itShouldParseTokens } from "./utils";

describe("parse-tokens: in-range", () => {
    itShouldParseTokens(
        inRangeCriterionTokenParser,
        [
            token(TokenType.Special, "("),
            token(TokenType.Number, "13"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "37"),
            token(TokenType.Special, "]"),
        ],
        inRange(13, 37, [false, true])
    );

    itShouldParseTokens(
        inRangeCriterionTokenParser,
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
        inRangeCriterionTokenParser,
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

    // parsing (1, ...) should be  (1, ...]
    itShouldParseTokens(
        inRangeCriterionTokenParser,
        [
            token(TokenType.Special, "("),
            token(TokenType.Number, "1"),
            token(TokenType.Special, ","),
            token(TokenType.Special, "."),
            token(TokenType.Special, "."),
            token(TokenType.Special, "."),
            token(TokenType.Special, ")"),
        ],
        inRange(1, void 0, false)
    );

    // parsing (..., 1) should be  [..., 1)
    itShouldParseTokens(
        inRangeCriterionTokenParser,
        [
            token(TokenType.Special, "("),
            token(TokenType.Special, "."),
            token(TokenType.Special, "."),
            token(TokenType.Special, "."),
            token(TokenType.Special, ","),
            token(TokenType.Number, "1"),
            token(TokenType.Special, ")"),
        ],
        inRange(void 0, 1, false)
    );
});
