import { token, TokenType } from "@entity-space/lexer";
import { or } from "../../lib/criterion/or/or.fn";
import { inRange } from "../../lib/criterion/range/in-range.fn";
import { inSet } from "../../lib/criterion/set/in-set.fn";
import { criteriaTokenParser } from "../../lib/parser/criteria.token-parser";
import { noBracketsCriteriaTokenParser } from "../../lib/parser/no-brackets-criteria.token-parser";
import { itShouldParseTokens } from "./utils";

describe("token-parser: value-criteria", () => {
    const terminator = token(TokenType.Special, ";");

    itShouldParseTokens(
        criteriaTokenParser,
        [
            token(TokenType.Special, "("),
            token(TokenType.Special, "("),
            token(TokenType.Number, "13"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "37"),
            token(TokenType.Special, "]"),
            token(TokenType.Combinator, "|"),
            token(TokenType.Special, "["),
            token(TokenType.Number, "100"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "200"),
            token(TokenType.Special, ")"),
            token(TokenType.Special, ")"),
        ],
        or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])])
    );

    itShouldParseTokens(
        criteriaTokenParser,
        [
            token(TokenType.Special, "("),
            token(TokenType.Special, "{"),
            token(TokenType.Number, "1"),
            token(TokenType.Special, "}"),
            token(TokenType.Combinator, "|"),
            token(TokenType.Special, "{"),
            token(TokenType.Number, "2"),
            token(TokenType.Special, "}"),
            token(TokenType.Special, ")"),
        ],
        or([inSet([1]), inSet([2])])
    );

    itShouldParseTokens(
        noBracketsCriteriaTokenParser,
        [
            token(TokenType.Special, "("),
            token(TokenType.Number, "13"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "37"),
            token(TokenType.Special, "]"),
            token(TokenType.Combinator, "|"),
            token(TokenType.Special, "["),
            token(TokenType.Number, "100"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "200"),
            token(TokenType.Special, ")"),
            terminator,
        ],
        or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])])
    );

    itShouldParseTokens(
        noBracketsCriteriaTokenParser,
        [
            token(TokenType.Special, "("),
            token(TokenType.Special, "("),
            token(TokenType.Number, "13"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "37"),
            token(TokenType.Special, "]"),
            token(TokenType.Combinator, "|"),
            token(TokenType.Special, "["),
            token(TokenType.Number, "100"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "200"),
            token(TokenType.Special, ")"),
            token(TokenType.Special, ")"),
            terminator,
        ],
        or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])])
    );

    itShouldParseTokens(
        criteriaTokenParser,
        [
            token(TokenType.Special, "("),
            token(TokenType.Special, "("),
            token(TokenType.Special, "("),
            token(TokenType.Number, "13"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "37"),
            token(TokenType.Special, "]"),
            token(TokenType.Combinator, "|"),
            token(TokenType.Special, "["),
            token(TokenType.Number, "100"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "200"),
            token(TokenType.Special, ")"),
            token(TokenType.Special, ")"),
            token(TokenType.Special, ")"),
        ],
        or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])])
    );
});