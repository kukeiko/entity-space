import { parseCriteria } from "../../parser";
import {
    and,
    inRange,
    inSet,
    isEven,
    isNull,
    isTrue,
    matches,
    notInSet,
    or,
    Criterion,
    isValue,
    notValue,
} from "../../criterion";

describe("parse-criteria", () => {
    function shouldParse(stringified: string, expected: Criterion): void {
        it(`should parse ${stringified}`, () => {
            const parse = () => parseCriteria(stringified);
            expect(parse).not.toThrow();
            expect(parse()).toEqual(expected);
        });
    }

    shouldParse("is 7", isValue(7));
    shouldParse("not 7", notValue(7));
    shouldParse('is "foo"', isValue("foo"));
    shouldParse('not "foo"', notValue("foo"));
    shouldParse("is-true", isTrue(true));
    shouldParse("is-true & is-odd", and<any>([isTrue(true), isEven(false)]));
    shouldParse("[1, 7]", inRange(1, 7));
    shouldParse("[..., 7.8)", inRange(void 0, 7.8, false));
    shouldParse("[.9, 2]", inRange(0.9, 2));
    shouldParse("[.9, ...]", inRange(0.9));
    shouldParse("[-.9, +1.2]", inRange(-0.9, 1.2));
    shouldParse("[..., 3) | (4, 7]", or([inRange(void 0, 3, false), inRange(4, 7, [false, true])]));
    shouldParse("[1, 7] | [3, 4]", or([inRange(1, 7), inRange(3, 4)]));
    shouldParse("([1, 7] | [3, 4])", or([inRange(1, 7), inRange(3, 4)]));
    shouldParse("[1, 7] | [3, 4]", or([inRange(1, 7), inRange(3, 4)]));
    shouldParse("{1, 2}", inSet([1, 2]));
    shouldParse("!{1, 2}", notInSet([1, 2]));
    shouldParse(
        "([1, 7] | [3, 4]) & ({123} | !{456})",
        and(or(inRange(1, 7), inRange(3, 4)), or(inSet([123]), notInSet([456])))
    );
    shouldParse(
        "(([1, 7] | [3, 4]) & ({123} | !{456} | is-odd | is-null)) | ({1,2,3} & [-0.9, ...])",
        or([
            and([or([inRange(1, 7), inRange(3, 4)]), or([inSet([123]), notInSet([456]), isEven(false), isNull(true)])]),
            and([inSet([1, 2, 3]), inRange(-0.9, void 0)]),
        ])
    );

    interface FooBar {
        foo: number;
        bar: number;
    }

    shouldParse("{ foo: [1, 7] }", matches({ foo: inRange(1, 7) }));
    shouldParse("{ foo: [1, 7], bar: [3, 4] }", matches({ foo: inRange(1, 7), bar: inRange(3, 4) }));
    shouldParse(
        "{ foo: [1, 7] } | { bar: [3, 4] }",
        or([matches<FooBar>({ foo: inRange(1, 7) }), matches<FooBar>({ bar: inRange(3, 4) })])
    );

    shouldParse(
        "(([1, 7] | [3, 4]) & ({123} | !{456})) | ({1,2,3} & [-0.9, ...] & ({ foo: [1, 7] } | { bar: [3, 4] }))",
        or([
            and(or(inRange(1, 7), inRange(3, 4)), or(inSet([123]), notInSet([456]))),
            and<any>([
                inSet([1, 2, 3]),
                inRange(-0.9, void 0),
                or(matches<FooBar>({ foo: inRange(1, 7) }), matches<FooBar>({ bar: inRange(3, 4) })),
            ]),
        ])
    );
});
