import { Token } from "@entity-space/lexer";
import { Criterion } from "../../lib/criteria/criterion/criterion";
import { CriterionTokenParser } from "../../lib/criteria/parser/criterion-token-parser.type";

export function itShouldParseTokens(
    makeGenerator: () => CriterionTokenParser,
    tokens: Token[],
    expected: Criterion,
    specFn = it
) {
    specFn(`should parse tokens '${tokens.map(t => t.value).join("")}' to ${expected}`, () => {
        const generator = makeGenerator();
        generator.next();

        let createCriterion: (() => Criterion) | undefined;
        for (const token of tokens) {
            const result = generator.next(token);

            if (result.value === false) {
                throw new Error(`parser did not accept token ${JSON.stringify(token)}`);
            } else if (result.value !== void 0) {
                createCriterion = result.value;
            }

            if (result.done) {
                break;
            }
        }

        if (createCriterion) {
            return expect(createCriterion()).toEqual(expected);
        }

        throw new Error("nothing parsed");
    });
}

export function fitShouldParseTokens(makeGenerator: () => CriterionTokenParser, tokens: Token[], expected: Criterion) {
    itShouldParseTokens(makeGenerator, tokens, expected, fit);
}

export function xitShouldParseTokens(makeGenerator: () => CriterionTokenParser, tokens: Token[], expected: Criterion) {
    itShouldParseTokens(makeGenerator, tokens, expected, xit);
}
