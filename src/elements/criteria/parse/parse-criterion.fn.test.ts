import { Primitive } from "@entity-space/utils";
import { describe, expect, test, TestAPI } from "vitest";
import { AndCriterion } from "../and-criterion";
import { Criterion } from "../criterion";
import { EntityCriterion } from "../entity-criterion";
import { EqualsCriterion } from "../equals-criterion";
import { InArrayCriterion } from "../in-array-criterion";
import { InRangeCriterion } from "../in-range-criterion";
import { NotEqualsCriterion } from "../not-equals-criterion";
import { NotInArrayCriterion } from "../not-in-array-criterion";
import { OrCriterion } from "../or-criterion";
import { parseCriterion } from "./parse-criterion.fn";

describe(parseCriterion.name, () => {
    const and = (criteria: Criterion[]) => new AndCriterion(criteria);
    const equals = (value: ReturnType<Primitive>) => new EqualsCriterion(value);
    const inArray = (values: ReturnType<Primitive>[]) => new InArrayCriterion(values);
    const notEquals = (value: ReturnType<Primitive>) => new NotEqualsCriterion(value);
    const notInArray = (values: ReturnType<Primitive>[]) => new NotInArrayCriterion(values);
    const or = (criteria: Criterion[]) => new OrCriterion(criteria);
    const where = <T extends any>(criteria: Partial<Record<keyof T, Criterion>>) =>
        new EntityCriterion(criteria as any);
    const inRange = <T extends typeof Number | typeof String>(
        values: readonly [ReturnType<T> | undefined, ReturnType<T> | undefined],
        inclusive: boolean | [boolean, boolean] = true,
    ) => new InRangeCriterion(values[0], values[1], inclusive);

    function shouldParse(stringified: string, expected: Criterion, specFn: TestAPI | TestAPI["skip"] = test): void {
        specFn(`should parse ${stringified}`, () => {
            const parse = () => parseCriterion(stringified);
            expect(parse).not.toThrow();
            expect(parse().toString()).toEqual(expected.toString());
        });
    }

    shouldParse("7", equals(7));
    shouldParse("!7", notEquals(7));
    shouldParse('"foo"', equals("foo"));
    shouldParse('!"foo"', notEquals("foo"));
    shouldParse("true", equals(true));
    shouldParse("!true", notEquals(true));
    shouldParse("false", equals(false));
    shouldParse("!false", notEquals(false));
    shouldParse("null", equals(null));
    shouldParse("!null", notEquals(null));
    shouldParse("undefined", equals(undefined));
    shouldParse("!undefined", notEquals(undefined));
    shouldParse("true & false", and([equals(true), equals(false)]));
    shouldParse("true | false", or([equals(true), equals(false)]));
    shouldParse("true | 1 & false", or([equals(true), and([equals(1), equals(false)])]));
    shouldParse("true & 1 | false", or([and([equals(true), equals(1)]), equals(false)]));
    shouldParse(
        "1 | 2 & 3 & 4 | 5 & 6 | 7",
        or([equals(1), and([equals(2), equals(3), equals(4)]), and([equals(5), equals(6)]), equals(7)]),
    );
    shouldParse(
        "(1 | 2 & 3 & 4 | 5 & 6 | 7)",
        or([equals(1), and([equals(2), equals(3), equals(4)]), and([equals(5), equals(6)]), equals(7)]),
    );
    shouldParse("7 | 8", or([equals(7), equals(8)]));
    shouldParse("7 & 8", and([equals(7), equals(8)]));
    shouldParse("[1, 7]", inRange([1, 7]));
    shouldParse("(0, 8)", inRange([0, 8], false));
    shouldParse("[..., 7.8)", inRange([undefined, 7.8], false));
    shouldParse("[.9, 2]", inRange([0.9, 2]));
    shouldParse("[.9, ...]", inRange([0.9, undefined]));
    shouldParse("[-.9, +1.2]", inRange([-0.9, 1.2]));
    shouldParse("[..., 3) | (4, 7]", or([inRange([undefined, 3], false), inRange([4, 7], [false, true])]));
    shouldParse("[1, 7] | [3, 4]", or([inRange([1, 7]), inRange([3, 4])]));
    shouldParse("(3, 4]", inRange([3, 4], [false, true]));
    shouldParse("(1, 7) | (3, 4]", or([inRange([1, 7], false), inRange([3, 4], [false, true])]));
    shouldParse("([1, 7] | [3, 4])", or([inRange([1, 7]), inRange([3, 4])]));
    shouldParse("[1, 7] | [3, 4]", or([inRange([1, 7]), inRange([3, 4])]));
    shouldParse("{1, 2}", inArray([1, 2]));
    shouldParse(`{1, 2, "foo", 3}`, inArray([1, 2, "foo", 3]));
    shouldParse(`{1, 2, "foo", null, undefined}`, inArray([1, 2, "foo", null, undefined]));
    shouldParse("!{1, 2}", notInArray([1, 2]));

    interface FooBar {
        foo: number;
        bar: number;
    }

    // named-criteria
    shouldParse('{ foo: 7, bar: "baz" }', where<FooBar>({ foo: equals(7), bar: equals("baz") }));
    shouldParse("{ foo: 7 }", where<FooBar>({ foo: equals(7) }));
    shouldParse("{ foo: [1, 7] }", where<FooBar>({ foo: inRange([1, 7]) }));
    shouldParse("{ foo: [1, 7], bar: [3, 4] }", where<FooBar>({ foo: inRange([1, 7]), bar: inRange([3, 4]) }));

    // here be the more complex, nested constructs
    shouldParse(
        "([1, 7] | [3, 4]) & ({123} | !{456})",
        and([or([inRange([1, 7]), inRange([3, 4])]), or([inArray([123]), notInArray([456])])]),
    );

    shouldParse("([1, 7])", or([inRange([1, 7])]));
    shouldParse("(([1, 7]))", or([or([inRange([1, 7])])]));
    shouldParse("([1, 7] | true)", or([inRange([1, 7]), equals(true)]));
    shouldParse("([1, 7] & true)", and([inRange([1, 7]), equals(true)]));

    shouldParse(
        "(([1, 7] | [3, 4]) & ({123} | !{456} | true | null)) | ({1,2,3} & [-0.9, ...])",
        or([
            and([
                or([inRange([1, 7]), inRange([3, 4])]),
                or([inArray([123]), notInArray([456]), equals(true), equals(null)]),
            ]),
            and([inArray([1, 2, 3]), inRange([-0.9, undefined])]),
        ]),
    );

    shouldParse(
        "{ foo: [1, 7] } | { bar: [3, 4] }",
        or([where<FooBar>({ foo: inRange([1, 7]) }), where<FooBar>({ bar: inRange([3, 4]) })]),
    );

    shouldParse(
        "(([1, 7] | [3, 4]) & ({123} | !{456})) | ({1,2,3} & [-0.9, ...] & ({ foo: [1, 7] } | { bar: [3, 4] }))",
        or([
            and([or([inRange([1, 7]), inRange([3, 4])]), or([inArray([123]), notInArray([456])])]),
            and([
                inArray([1, 2, 3]),
                inRange([-0.9, undefined]),
                or([where<FooBar>({ foo: inRange([1, 7]) }), where<FooBar>({ bar: inRange([3, 4]) })]),
            ]),
        ]),
    );

    shouldParse(
        '{ foo: (7 | 64 | -7), bar: "baz" } | false',
        or([where({ foo: or([equals(7), equals(64), equals(-7)]), bar: equals("baz") }), equals(false)]),
    );

    shouldParse(
        '{ foo: (7 | ((13, 37) & (100, 200)) | -7), bar: "baz" } | false',
        or([
            where({
                foo: or([equals(7), and([inRange([13, 37], false), inRange([100, 200], false)]), equals(-7)]),
                bar: equals("baz"),
            }),
            equals(false),
        ]),
    );

    shouldParse(
        'true & ({ foo: 7, bar: "baz" } | 64)',
        and([equals(true), or([where({ foo: equals(7), bar: equals("baz") }), equals(64)])]),
    );
});
