import { ParseTokenGenerator } from "./parse-token-generator.type";

export function* parseTokensGenerator(createGenerators: (() => ParseTokenGenerator)[]): ParseTokenGenerator {
    let generators = createGenerators.map(create => create());
    generators.forEach(gen => gen.next());

    while (generators.length > 0) {
        let token = yield;

        for (const generator of generators.slice()) {
            const result = generator.next(token);

            if (result.value === false) {
                generators = generators.filter(gen => gen !== generator);
            } else if (result.done && result.value !== void 0) {
                return result.value;
            }
        }
    }

    return false;
}
