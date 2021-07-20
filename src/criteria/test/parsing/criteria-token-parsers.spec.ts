import { Token, TokenType } from "../../parser";
import { parseInRangeGenerator, parseInSetGenerator, ParseTokenGenerator, parseValueCriteriaGenerator } from "../../parser/token-parser";
import { inRange, inSet, notInSet, or, ValueCriterion } from "../../value-criterion";

describe("criteria-token-parser", () => {
    function generatorShouldParse(makeGenerator: () => ParseTokenGenerator, tokens: Token[], expected: ValueCriterion) {
        it(`should parse tokens to ${expected}`, () => {
            const generator = makeGenerator();
            generator.next();

            for (const token of tokens) {
                const result = generator.next(token);

                if (result.value === false) {
                    return fail(`parser did not accept token ${JSON.stringify(token)}`);
                } else if (result.value !== true) {
                    // assert
                    expect(result.value).toEqual(expected);
                }

                if (result.done) {
                    break;
                }
            }
        });
    }

    function token(type: TokenType, value: string): Token {
        return { type, value };
    }

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
