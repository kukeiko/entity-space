import { Token, TokenType } from "../../parser";
import { InRangeTokenParser, SetTokenParser, ValueCriteriaTokenParser } from "../../parser/token-parser";
import { inRange, inSet, notInSet, or } from "../../value-criterion";

describe("criteria-token-parser", () => {
    function token(type: TokenType, value: string): Token {
        return { type, value };
    }

    it("should parse tokens for in-range", () => {
        // arrange
        const parser = new InRangeTokenParser();
        const expected = inRange(13, 37, [false, true]);
        const tokens: Token[] = [
            token(TokenType.Special, "("),
            token(TokenType.Number, "13"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "37"),
            token(TokenType.Special, "]"),
        ];

        // act
        for (const token of tokens) {
            if (!parser.accept(token)) {
                return fail(`parser did not accept token ${JSON.stringify(token)}`);
            }
        }

        // assert
        expect(parser.isComplete()).toEqual(true);
        expect(parser.getResult()).toEqual(expected);
    });

    it("should parse [..., 7]", () => {
        // arrange
        const parser = new InRangeTokenParser();
        const expected = inRange(void 0, 7);
        const tokens: Token[] = [
            token(TokenType.Special, "["),
            token(TokenType.Number, "..."),
            token(TokenType.Special, ","),
            token(TokenType.Number, "7"),
            token(TokenType.Special, "]"),
        ];

        // act
        for (const token of tokens) {
            if (!parser.accept(token)) {
                return fail(`parser did not accept token ${JSON.stringify(token)}`);
            }
        }

        // assert
        expect(parser.isComplete()).toEqual(true);
        expect(parser.getResult()).toEqual(expected);
    });

    it("should parse (1, ...]", () => {
        // arrange
        const parser = new InRangeTokenParser();
        const expected = inRange(1, void 0, false);
        const tokens: Token[] = [
            token(TokenType.Special, "("),
            token(TokenType.Number, "1"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "..."),
            token(TokenType.Special, "]"),
        ];

        // act
        for (const token of tokens) {
            if (!parser.accept(token)) {
                return fail(`parser did not accept token ${JSON.stringify(token)}`);
            }
        }

        // assert
        expect(parser.isComplete()).toEqual(true);
        expect(parser.getResult()).toEqual(expected);
    });

    it("should parse {1, 2, 3}", () => {
        // arrange
        const parser = new SetTokenParser();
        const expected = inSet([1, 2, 3]);
        const tokens: Token[] = [
            token(TokenType.Special, "{"),
            token(TokenType.Number, "1"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "2"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "3"),
            token(TokenType.Special, "}"),
        ];

        // act
        for (const token of tokens) {
            if (!parser.accept(token)) {
                return fail(`parser did not accept token ${JSON.stringify(token)}`);
            }
        }

        // assert
        expect(parser.isComplete()).toEqual(true);
        expect(parser.getResult()).toEqual(expected);
    });

    it("should parse !{1, 2, 3}", () => {
        // arrange
        const parser = new SetTokenParser();
        const expected = notInSet([1, 2, 3]);
        const tokens: Token[] = [
            token(TokenType.Special, "!"),
            token(TokenType.Special, "{"),
            token(TokenType.Number, "1"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "2"),
            token(TokenType.Special, ","),
            token(TokenType.Number, "3"),
            token(TokenType.Special, "}"),
        ];

        // act
        for (const token of tokens) {
            if (!parser.accept(token)) {
                return fail(`parser did not accept token ${JSON.stringify(token)}`);
            }
        }

        // assert
        expect(parser.isComplete()).toEqual(true);
        expect(parser.getResult()).toEqual(expected);
    });

    it("should parse value-criteria", () => {
        // arrange
        const parser = new ValueCriteriaTokenParser();
        const expected = or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])]);
        const tokens: Token[] = [
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
        ];

        // act
        for (const token of tokens) {
            if (!parser.accept(token)) {
                return fail(`parser did not accept token ${JSON.stringify(token)}`);
            } else {
                // console.log(`accepted`, token);
            }
        }

        // assert
        expect(parser.isComplete()).toEqual(true);
        expect(parser.getResult()).toEqual(expected);
    });

    it("should parse value-criteria", () => {
        // arrange
        const parser = new ValueCriteriaTokenParser();
        const expected = or([or([inRange(13, 37, [false, true]), inRange(100, 200, [true, false])])]);
        const tokens: Token[] = [
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
        ];

        // act
        for (const token of tokens) {
            if (!parser.accept(token)) {
                return fail(`parser did not accept token ${JSON.stringify(token)}`);
            } else {
                // console.log(`accepted`, token);
            }
        }

        // assert
        expect(parser.isComplete()).toEqual(true);
        expect(parser.getResult()).toEqual(expected);
    });
});
