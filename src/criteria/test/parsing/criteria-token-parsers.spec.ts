import {
    Token,
    TokenType,
    parseInRangeGenerator,
    parseInSetGenerator,
    ParseTokenGenerator,
    parseValueCriteriaGenerator,
    token,
    parseNotBracketedCriteriaGenerator,
} from "../../parser";
import { inRange, inSet, notInSet, or, ValueCriterion } from "../../value-criterion";

describe("criteria-token-parser", () => {
    function itShouldParse(makeGenerator: () => ParseTokenGenerator, tokens: Token[], expected: ValueCriterion, specFn = it) {
        specFn(`should parse tokens '${tokens.map(t => t.value).join("")}' to ${expected}`, () => {
            const generator = makeGenerator();
            generator.next();

            for (const token of tokens) {
                const result = generator.next(token);

                if (result.value === false) {
                    return fail(`parser did not accept token ${JSON.stringify(token)}`);
                } else if (result.value !== undefined && result.done) {
                    return expect(result.value()).toEqual(expected);
                }
            }

            fail("nothing parsed");
        });
    }

    function fitShouldParse(makeGenerator: () => ParseTokenGenerator, tokens: Token[], expected: ValueCriterion) {
        itShouldParse(makeGenerator, tokens, expected, fit);
    }

    function xitShouldParse(makeGenerator: () => ParseTokenGenerator, tokens: Token[], expected: ValueCriterion) {
        itShouldParse(makeGenerator, tokens, expected, xit);
    }

    describe("in-range", () => {
        itShouldParse(
            parseInRangeGenerator,
            [token(TokenType.Special, "("), token(TokenType.Number, "13"), token(TokenType.Special, ","), token(TokenType.Number, "37"), token(TokenType.Special, "]")],
            inRange(13, 37, [false, true])
        );

        itShouldParse(
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

        itShouldParse(
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

    describe("in-set / not-in-set", () => {
        itShouldParse(
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

        itShouldParse(
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

    describe("value-criteria", () => {
        const terminator = token(TokenType.Special, ";");

        itShouldParse(
            parseValueCriteriaGenerator,
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

        itShouldParse(
            parseValueCriteriaGenerator,
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

        itShouldParse(
            parseNotBracketedCriteriaGenerator,
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

        // [todo] should actually unpack nested "or" with only 1 item
        itShouldParse(
            parseNotBracketedCriteriaGenerator,
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
            or([or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])])])
        );

        itShouldParse(
            parseValueCriteriaGenerator,
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
            or([or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])])])
        );
    });
});
