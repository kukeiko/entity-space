import { describe, expect, it } from "vitest";
import { lex } from "./lex.fn";
import { Token, TokenType, token } from "./token";

describe(lex.name, () => {
    it("should return empty array of tokens when given an empty string", () => {
        expect(lex("")).toEqual([]);
    });

    function shouldLex(input: string, tokens: readonly Token[], specFn = it): void {
        specFn(
            `should lex ${input} to [${tokens.map(token => `${TokenType[token.type]}(${token.value})`).join(", ")}]`,
            () => {
                const lexed = lex(input);
                expect(lexed).toEqual(tokens);
            },
        );
    }

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
    shouldLex('"foo"', [token(TokenType.String, "foo")]);
    shouldLex("true", [token(TokenType.Literal, "true")]);
    shouldLex("false", [token(TokenType.Literal, "false")]);
    shouldLex("null", [token(TokenType.Literal, "null")]);
    shouldLex(`1 | "foo" & ...`, [
        token(TokenType.Number, "1"),
        token(TokenType.Combinator, "|"),
        token(TokenType.String, "foo"),
        token(TokenType.Combinator, "&"),
        token(TokenType.Special, "."),
        token(TokenType.Special, "."),
        token(TokenType.Special, "."),
    ]);
    shouldLex(`{ 1, 2, "foo", null, undefined }`, [
        token(TokenType.Special, "{"),
        token(TokenType.Number, "1"),
        token(TokenType.Special, ","),
        token(TokenType.Number, "2"),
        token(TokenType.Special, ","),
        token(TokenType.String, "foo"),
        token(TokenType.Special, ","),
        token(TokenType.Literal, "null"),
        token(TokenType.Special, ","),
        token(TokenType.Literal, "undefined"),
        token(TokenType.Special, "}"),
    ]);

    it("should throw for unexpected characters", () => {
        expect(() => lex("\r")).toThrow(`unexpected character "\r"`);
    });
});
