import { ParseTokenGenerator, Token } from "../../parser";
import { ValueCriterion } from "../../value-criterion";

export function itShouldParseTokens(makeGenerator: () => ParseTokenGenerator, tokens: Token[], expected: ValueCriterion, specFn = it) {
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

export function fitShouldParseTokens(makeGenerator: () => ParseTokenGenerator, tokens: Token[], expected: ValueCriterion) {
    itShouldParseTokens(makeGenerator, tokens, expected, fit);
}

export function xitShouldParseTokens(makeGenerator: () => ParseTokenGenerator, tokens: Token[], expected: ValueCriterion) {
    itShouldParseTokens(makeGenerator, tokens, expected, xit);
}