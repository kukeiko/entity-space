import {
    and,
    Criterion,
    inRange,
    inSet,
    isEven,
    isNull,
    isTrue,
    isValue,
    notInSet,
    notValue,
    or,
} from "../../criterion";
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

    shouldParse(isValue(7).toString(), isValue(7));
    shouldParse(notValue(7).toString(), notValue(7));

    shouldParse(isValue("foo").toString(), isValue("foo"));
    shouldParse(notValue("foo").toString(), notValue("foo"));

    shouldParse(isTrue(true).toString(), isTrue(true));
    shouldParse(isTrue(false).toString(), isTrue(false));

    shouldParse(isNull(true).toString(), isNull(true));
    shouldParse(isNull(false).toString(), isNull(false));

    shouldParse(isEven(true).toString(), isEven(true));
    shouldParse(isEven(false).toString(), isEven(false));
});
