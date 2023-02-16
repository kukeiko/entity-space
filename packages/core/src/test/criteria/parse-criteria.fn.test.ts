import { ICriterion } from "../../lib/criteria/vnext/criterion.interface";
import { EntityCriteriaFactory } from "../../lib/criteria/vnext/entity-criteria-factory";
import { parseCriteria_vnext } from "../../lib/criteria/vnext/parsing/parse-criteria.fn";

describe("parse-criteria", () => {
    const tools = new EntityCriteriaFactory();
    const { equals, notEquals, and, or, isOdd, all, inRange, inArray, notInArray, none, never, where } = tools;

    function shouldParse(stringified: string, expected: ICriterion, specFn = it): void {
        specFn(`should parse ${stringified}`, () => {
            const parse = () => parseCriteria_vnext(tools, stringified);
            expect(parse).not.toThrow();
            expect(parse()).toEqual(expected);
        });
    }

    shouldParse("7", equals(7));
    shouldParse("!7", notEquals(7));
    shouldParse('"foo"', equals("foo"));
    shouldParse('!"foo"', notEquals("foo"));
    shouldParse("true", equals(true));
    shouldParse("true & odd", and([equals(true), isOdd()]));
    shouldParse("true | odd", or([equals(true), isOdd()]));
    shouldParse("true | odd & false", or([equals(true), and(isOdd(), equals(false))]));
    shouldParse("true & odd | false", or([and(equals(true), isOdd()), equals(false)]));
    shouldParse("true & odd | false", or([and(equals(true), isOdd()), equals(false)]));
    shouldParse(
        "1 | 2 & 3 & 4 | 5 & 6 | 7",
        or(equals(1), and(equals(2), equals(3), equals(4)), and(equals(5), equals(6)), equals(7))
    );
    shouldParse(
        "(1 | 2 & 3 & 4 | 5 & 6 | 7)",
        or(equals(1), and(equals(2), equals(3), equals(4)), and(equals(5), equals(6)), equals(7))
    );
    shouldParse("7 | 8", or(equals(7), equals(8)));
    shouldParse("7 & 8", and(equals(7), equals(8)));
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
    shouldParse("{1, 2}", inArray([1, 2]));
    shouldParse("!{1, 2}", notInArray([1, 2]));
    shouldParse("all", all());
    shouldParse("none", none(), xit); // [todo] implement
    shouldParse("never", never(), xit); // [todo] implement

    interface FooBar {
        foo: number;
        bar: number;
    }

    // named-criteria
    shouldParse('{ foo: 7, bar: "baz" }', where<FooBar>({ foo: equals(7), bar: equals("baz") }));
    shouldParse("{ foo: 7 }", where<FooBar>({ foo: equals(7) }));
    shouldParse("{ foo: [1, 7] }", where<FooBar>({ foo: inRange(1, 7) }));
    shouldParse("{ foo: [1, 7], bar: [3, 4] }", where<FooBar>({ foo: inRange(1, 7), bar: inRange(3, 4) }));

    // here be the more complex, nested constructs
    shouldParse(
        "([1, 7] | [3, 4]) & ({123} | !{456})",
        and(or(inRange(1, 7), inRange(3, 4)), or(inArray([123]), notInArray([456])))
    );
    shouldParse(
        "(([1, 7] | [3, 4]) & ({123} | !{456} | odd | null)) | ({1,2,3} & [-0.9, ...])",
        or([
            and([or([inRange(1, 7), inRange(3, 4)]), or([inArray([123]), notInArray([456]), isOdd(), equals(null)])]),
            and([inArray([1, 2, 3]), inRange(-0.9, void 0)]),
        ])
    );

    shouldParse(
        "{ foo: [1, 7] } | { bar: [3, 4] }",
        or([where<FooBar>({ foo: inRange(1, 7) }), where<FooBar>({ bar: inRange(3, 4) })])
    );

    shouldParse(
        "(([1, 7] | [3, 4]) & ({123} | !{456})) | ({1,2,3} & [-0.9, ...] & ({ foo: [1, 7] } | { bar: [3, 4] }))",
        or([
            and(or(inRange(1, 7), inRange(3, 4)), or(inArray([123]), notInArray([456]))),
            and(
                inArray([1, 2, 3]),
                inRange(-0.9, void 0),
                or(where<FooBar>({ foo: inRange(1, 7) }), where<FooBar>({ bar: inRange(3, 4) }))
            ),
        ])
    );

    shouldParse(
        '{ foo: (7 | 64 | -7), bar: "baz" } | false',
        or(where({ foo: or(equals(7), equals(64), equals(-7)), bar: equals("baz") }), equals(false))
    );

    shouldParse(
        '{ foo: (7 | ((13, 37) & (100, 200)) | -7), bar: "baz" } | false',
        or(
            where({
                foo: or(equals(7), and(inRange(13, 37, false), inRange(100, 200, false)), equals(-7)),
                bar: equals("baz"),
            }),
            equals(false)
        )
    );

    shouldParse(
        'true & ({ foo: 7, bar: "baz" } | 64)',
        and(equals(true), or(where({ foo: equals(7), bar: equals("baz") }), equals(64)))
    );
});
