import { lex } from "./lex.fn";
import { TokenType } from "./token-type.enum";
import { Token } from "./token.contract";
import { token } from "./token.fn";

describe("lexer", () => {
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
        specFn(
            `should lex ${input} to [${tokens.map(token => `${TokenType[token.type]}(${token.value})`).join(", ")}]`,
            () => {
                const lexed = lex(input);
                expect(lexed).toEqual(tokens);
            }
        );
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

    shouldLex(".7 foo-bar", [token(TokenType.Number, ".7"), token(TokenType.Literal, "foo-bar")]);

    shouldLex(".7 foo-bar: [123, 789)", [
        token(TokenType.Number, ".7"),
        token(TokenType.Literal, "foo-bar"),
        token(TokenType.Special, ":"),
        token(TokenType.Special, "["),
        token(TokenType.Number, "123"),
        token(TokenType.Special, ","),
        token(TokenType.Number, "789"),
        token(TokenType.Special, ")"),
    ]);

    shouldLex('"foo"', [token(TokenType.String, "foo")]);
    shouldLex("true", [token(TokenType.Literal, "true")]);
    shouldLex("false", [token(TokenType.Literal, "false")]);
    shouldLex("null", [token(TokenType.Literal, "null")]);
});
