import { TokenParser } from "./token-parser.type";

export function* tokenParser(createGenerators: (() => TokenParser)[]): TokenParser {
    let generators = createGenerators.map(create => create());
    generators.forEach(gen => gen.next());

    while (generators.length > 0) {
        let token = yield;

        for (const generator of generators.slice()) {
            const result = generator.next(token);

            if (result.value === false) {
                generators = generators.filter(gen => gen !== generator);
            } else if (result.done && result.value !== void 0) {
                // [todo] exiting early does not allow for writing "is-value-criterion" as just the value,
                // i.e. we have to write { foo: is 7 } instead of { foo: 7 }
                // it's been a while since i wrote the lexing/parsing so i'm not sure if we can just
                // switch over to a greedy algorithm by waiting for all generators to finish, and
                // then take the result of the one that finished last?
                // also: this line of thinking seems kinda familiar to me, and i'm afraid it's not gonna work. well, we'll see i guess.
                return result.value;
            }
        }
    }

    return false;
}
