import { lex, Token, TokenType } from "../../parser";

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

    function shouldLex(input: string, tokens: Token[]): void {
        it(`should lex ${input} to ${JSON.stringify(tokens)}`, () => {
            const lexed = lex(input);
            expect(lexed).toEqual(tokens);
        });
    }

    const sample = `{
        name: contains("foo") & ends-with("bar"),
        price: (100, 900] | (1300, 2000) | [10 - 30),
        author: { name: {"bob"} } | { surname: {"uncle", "burger"} }
    }`;

    shouldLex("123", [{ type: TokenType.Number, value: "123" }]);
    shouldLex("{123}", [
        { type: TokenType.Special, value: "{" },
        { type: TokenType.Number, value: "123" },
        { type: TokenType.Special, value: "}" },
    ]);

    shouldLex("[123, 789)", [
        { type: TokenType.Special, value: "[" },
        { type: TokenType.Number, value: "123" },
        { type: TokenType.Special, value: "," },
        { type: TokenType.Number, value: "789" },
        { type: TokenType.Special, value: ")" },
    ]);
});
