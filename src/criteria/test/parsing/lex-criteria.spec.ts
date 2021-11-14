import { lex, token, Token, TokenType } from "../../parser";

describe("criteria-lexer", () => {
    it("should return empty array of tokens when given an empty string", () => {
        // arrange
        const input = "";
        const expected: Token[] = [];

        // act
        const lexed = lex(input);

        // assert
        expect(lexed).toEqual(expected);
    });

    function shouldLex(input: string, tokens: Token[], specFn = it): void {
        specFn(`should lex ${input} to ${JSON.stringify(tokens)}`, () => {
            const lexed = lex(input);
            expect(lexed).toEqual(tokens);
        });
    }

    function fshouldLex(input: string, tokens: Token[]): void {
        shouldLex(input, tokens, fit);
    }

    function xshouldLex(input: string, tokens: Token[]): void {
        shouldLex(input, tokens, xit);
    }

    const sample = `{
        name: contains("foo") & ends-with("bar"),
        price: (100, 900] | (1300, 2000) | [10 - 30),
        author: { name: {"bob"} } | { surname: {"uncle", "burger"} }
    }`;

    shouldLex("123", [token(TokenType.Number, "123")]);
    shouldLex("{123}", [token(TokenType.Special, "{"), token(TokenType.Number, "123"), token(TokenType.Special, "}")]);

    shouldLex("[123, 789)", [
        token(TokenType.Special, "["),
        token(TokenType.Number, "123"),
        token(TokenType.Special, ","),
        token(TokenType.Number, "789"),
        token(TokenType.Special, ")"),
    ]);

    shouldLex(".7 foo-bar", [token(TokenType.Number, ".7"), token(TokenType.Symbol, "foo-bar")]);

    shouldLex(".7 foo-bar: [123, 789)", [
        token(TokenType.Number, ".7"),
        token(TokenType.Symbol, "foo-bar"),
        token(TokenType.Special, ":"),
        token(TokenType.Special, "["),
        token(TokenType.Number, "123"),
        token(TokenType.Special, ","),
        token(TokenType.Number, "789"),
        token(TokenType.Special, ")"),
    ]);

    shouldLex('"foo"', [token(TokenType.String, "foo")]);
});
