import { Token } from "@entity-space/lexer";
import { Criterion } from "../../criterion/criterion";
import { TokenParser } from "../../parser";

export function itShouldParseTokens(
    makeGenerator: () => TokenParser,
    tokens: Token[],
    expected: Criterion,
    specFn = it
) {
    specFn(`should parse tokens '${tokens.map(t => t.value).join("")}' to ${expected}`, () => {
        const generator = makeGenerator();
        generator.next();

        for (const token of tokens) {
            const result = generator.next(token);

            if (result.value === false) {
                throw new Error(`parser did not accept token ${JSON.stringify(token)}`);
            } else if (result.value !== undefined && result.done) {
                return expect(result.value()).toEqual(expected);
            }
        }

        throw new Error("nothing parsed");
    });
}

export function fitShouldParseTokens(makeGenerator: () => TokenParser, tokens: Token[], expected: Criterion) {
    itShouldParseTokens(makeGenerator, tokens, expected, fit);
}

export function xitShouldParseTokens(makeGenerator: () => TokenParser, tokens: Token[], expected: Criterion) {
    itShouldParseTokens(makeGenerator, tokens, expected, xit);
}
