import { CriterionTokenParser } from "./criterion-token-parser.type";

// [todo] want to move to @entity-space/lexer eventually
export function* tokenParser(createGenerators: (() => CriterionTokenParser)[]): CriterionTokenParser {
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
