import { and } from "../../criterion/and/and.fn";
import { isEven } from "../../criterion/binary/is-even.fn";
import { Criterion } from "../../criterion/criterion";
import { or } from "../../criterion/or/or.fn";
import { inRange } from "../../criterion/range/in-range.fn";
import { inSet } from "../../criterion/set/in-set.fn";
import { notInSet } from "../../criterion/set/not-in-set.fn";
import { isValue } from "../../criterion/value/is-value.fn";
import { notValue } from "../../criterion/value/not-value.fn";
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

    shouldParse(isValue(true).toString(), isValue(true));
    shouldParse(isValue(false).toString(), isValue(false));

    shouldParse(isValue(null).toString(), isValue(null));
    shouldParse(notValue(null).toString(), notValue(null));

    shouldParse(isEven(true).toString(), isEven(true));
    shouldParse(isEven(false).toString(), isEven(false));
});
