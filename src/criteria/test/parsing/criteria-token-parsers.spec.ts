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
    function generatorShouldParse(makeGenerator: () => ParseTokenGenerator, tokens: Token[], expected: ValueCriterion, specFn = it) {
        specFn(`should parse tokens '${tokens.map(t => t.value).join("")}' to ${expected}`, () => {
            const generator = makeGenerator();
            generator.next();

            let intermediateResult: (() => ValueCriterion) | undefined;

            for (const token of tokens) {
                const result = generator.next(token);

                if (result.value === false) {
                    return fail(`parser did not accept token ${JSON.stringify(token)}`);
                } else if (result.value !== undefined) {
                    if (result.done) {
                        // assert
                        expect(result.value()).toEqual(expected);
                    } else {
                        intermediateResult = result.value;
                    }
                }

                if (result.done) {
                    return;
                }
            }

            if (intermediateResult !== void 0) {
                // assert
                expect(intermediateResult()).toEqual(expected);
            } else {
                fail("nothing parsed");
            }
        });
    }

    function fgeneratorShouldParse(makeGenerator: () => ParseTokenGenerator, tokens: Token[], expected: ValueCriterion) {
        generatorShouldParse(makeGenerator, tokens, expected, fit);
    }

    function xgeneratorShouldParse(makeGenerator: () => ParseTokenGenerator, tokens: Token[], expected: ValueCriterion) {
        generatorShouldParse(makeGenerator, tokens, expected, xit);
    }

    describe("in-range", () => {
        generatorShouldParse(
            parseInRangeGenerator,
            [token(TokenType.Special, "("), token(TokenType.Number, "13"), token(TokenType.Special, ","), token(TokenType.Number, "37"), token(TokenType.Special, "]")],
            inRange(13, 37, [false, true])
        );

        generatorShouldParse(
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

        generatorShouldParse(
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
        generatorShouldParse(
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

        generatorShouldParse(
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

        generatorShouldParse(
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

        generatorShouldParse(
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

        generatorShouldParse(
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
        generatorShouldParse(
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

        generatorShouldParse(
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
