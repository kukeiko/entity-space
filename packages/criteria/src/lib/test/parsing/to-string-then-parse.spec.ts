import { and, Criterion, inRange, inSet, notInSet, or } from "../../criterion";
import { parseCriteria } from "../../parser";

describe("to-string-then-parse", () => {
    function shouldParse(stringified: string, expected: Criterion): void {
        it(`should parse ${stringified}`, () => {
            const parse = () => parseCriteria(stringified);
            expect(parse).not.toThrow();
            expect(parse()).toEqual(expected);
        });
    }

    const toStringAndParse = or([
        and([or([inRange(1, 7), inRange(3, 4)]), or([inSet([123]), notInSet([456])])]),
        and([inSet([1, 2, 3]), inRange(-0.9, void 0)]),
    ]);

    shouldParse(toStringAndParse.toString(), toStringAndParse);
});
