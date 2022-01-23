import {
    and,
    Criterion,
    inRange,
    inSet,
    isEven,
    isNull,
    isTrue,
    isValue,
    matches,
    notInSet,
    notValue,
    or,
} from "../../criterion";
import { parseCriteria } from "../../parser";

describe("parse-criteria", () => {
    function shouldParse(stringified: string, expected: Criterion, specFn = it): void {
        specFn(`should parse ${stringified}`, () => {
            const parse = () => parseCriteria(stringified);
            expect(parse).not.toThrow();
            expect(parse()).toEqual(expected);
        });
    }

    function fshouldParse(stringified: string, expected: Criterion): void {
        shouldParse(stringified, expected, fit);
    }

    function xshouldParse(stringified: string, expected: Criterion): void {
        shouldParse(stringified, expected, xit);
    }

    shouldParse("7", isValue(7));
    shouldParse("!7", notValue(7));
    shouldParse('"foo"', isValue("foo"));
    shouldParse('!"foo"', notValue("foo"));
    shouldParse("true", isTrue(true));
    shouldParse("true & odd", and<any>([isTrue(true), isEven(false)]));
    shouldParse("7 | 8", or(isValue(7), isValue(8)));
    shouldParse("7 & 8", and(isValue(7), isValue(8)));
    shouldParse("[1, 7]", inRange(1, 7));
    shouldParse("(0, 8)", inRange(0, 8, false));
    shouldParse("[..., 7.8)", inRange(void 0, 7.8, false));
    shouldParse("[.9, 2]", inRange(0.9, 2));
    shouldParse("[.9, ...]", inRange(0.9));
    shouldParse("[-.9, +1.2]", inRange(-0.9, 1.2));
    shouldParse("[..., 3) | (4, 7]", or([inRange(void 0, 3, false), inRange(4, 7, [false, true])]));
    shouldParse("[1, 7] | [3, 4]", or([inRange(1, 7), inRange(3, 4)]));
    shouldParse("(3, 4]", inRange(3, 4, [false, true]));
    shouldParse("(1, 7) | (3, 4]", or([inRange(1, 7, false), inRange(3, 4, [false, true])]));
    shouldParse("([1, 7] | [3, 4])", or([inRange(1, 7), inRange(3, 4)]));
    shouldParse("[1, 7] | [3, 4]", or([inRange(1, 7), inRange(3, 4)]));
    shouldParse("{1, 2}", inSet([1, 2]));
    shouldParse("!{1, 2}", notInSet([1, 2]));

    interface FooBar {
        foo: number;
        bar: number;
    }

    // named-criteria
    shouldParse('{ foo: 7, bar: "baz" }', matches<FooBar>({ foo: isValue(7), bar: isValue("baz") }));
    shouldParse("{ foo: 7 }", matches<FooBar>({ foo: isValue(7) }));
    shouldParse("{ foo: [1, 7] }", matches<FooBar>({ foo: inRange(1, 7) }));
    shouldParse("{ foo: [1, 7], bar: [3, 4] }", matches<FooBar>({ foo: inRange(1, 7), bar: inRange(3, 4) }));

    // here be the more complex, nested constructs
    shouldParse(
        "([1, 7] | [3, 4]) & ({123} | !{456})",
        and(or(inRange(1, 7), inRange(3, 4)), or(inSet([123]), notInSet([456])))
    );
    shouldParse(
        "(([1, 7] | [3, 4]) & ({123} | !{456} | odd | null)) | ({1,2,3} & [-0.9, ...])",
        or([
            and([or([inRange(1, 7), inRange(3, 4)]), or([inSet([123]), notInSet([456]), isEven(false), isNull(true)])]),
            and([inSet([1, 2, 3]), inRange(-0.9, void 0)]),
        ])
    );

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

    shouldParse(
        '{ foo: (7 | 64 | -7), bar: "baz" } | false',
        or(matches({ foo: or(isValue(7), isValue(64), isValue(-7)), bar: isValue("baz") }), isTrue(false))
    );

    shouldParse(
        '{ foo: (7 | ((13, 37) & (100, 200)) | -7), bar: "baz" } | false',
        or(
            matches({
                foo: or(isValue(7), and(inRange(13, 37, false), inRange(100, 200, false)), isValue(-7)),
                bar: isValue("baz"),
            }),
            isTrue(false)
        )
    );

    shouldParse(
        'true & ({ foo: 7, bar: "baz" } | 64)',
        and(isTrue(true), or(matches({ foo: isValue(7), bar: isValue("baz") }), isValue(64)))
    );
});
