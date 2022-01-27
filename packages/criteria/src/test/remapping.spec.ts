import { Criterion } from "../lib/criterion/criterion";
import { matches } from "../lib/criterion/named/matches.fn";
import { NamedCriteriaTemplate } from "../lib/criterion/named/named-criteria-template";
import { OrCriteriaTemplate } from "../lib/criterion/or/or-criteria-template";
import { or } from "../lib/criterion/or/or.fn";
import { InNumberRangeCriterion } from "../lib/criterion/range/in-number-range-criterion";
import { inRange } from "../lib/criterion/range/in-range.fn";
import { inSetTemplate } from "../lib/criterion/set/in-set-template.fn";
import { inSet } from "../lib/criterion/set/in-set.fn";
import { isValueTemplate } from "../lib/criterion/value/is-value-template.fn";
import { isValue } from "../lib/criterion/value/is-value.fn";

type RemapOneResult = ReturnType<Criterion["remapOne"]>;

/**
 * [todo] spec names are preliminary. ideally we use same syntax as we do in reduction specs,
 * for which we would need to first write a parser for criteria templates.
 */
describe("remapping", () => {
    it("in-number-range #1", () => {
        // arrange
        const criterion = inRange(1, 7);
        const template = new OrCriteriaTemplate([InNumberRangeCriterion]);

        const expected: RemapOneResult = [[or(criterion)]];

        // act
        const actual = criterion.remapOne(template);

        // assert
        expect(actual).toEqual(expected);
    });

    it("in-number-range #2", () => {
        // arrange
        const criterion = inRange(1, 7);
        const template = new OrCriteriaTemplate([inSetTemplate([Number]), InNumberRangeCriterion]);
        const expected: RemapOneResult = [[or(criterion)]];

        // act
        const actual = criterion.remapOne(template);

        // assert
        expect(actual).toEqual(expected);
    });

    it("or-criteria #1", () => {
        // arrange
        const criterion = or(inRange(1, 7), inRange(10, 13));
        const template = InNumberRangeCriterion;
        // const expected: RemapOneResult = [[inRange(1, 7)], or(inRange(10, 13))];
        // [todo] had to put "void 0" to satisfy jasmine - think about what we want RemapOneResult to be;
        // - always 2 elements
        // - 1 element if 2nd would be void 0
        const expected: RemapOneResult = [[inRange(1, 7), inRange(10, 13)], void 0];

        // act
        const actual = criterion.remapOne(template);

        // assert
        expect(actual).toEqual(expected);
    });

    it("or-criteria #2", () => {
        // arrange
        const criterion = or(inRange(1, 7), inRange(10, 13), inSet([1, 2, 3]));
        const template = new OrCriteriaTemplate([InNumberRangeCriterion]);
        const expected: RemapOneResult = [[or(inRange(1, 7), inRange(10, 13))], or(inSet([1, 2, 3]))];

        // act
        const actual = criterion.remapOne(template);

        // assert
        expect(actual).toEqual(expected);
    });

    it("in-number-set to is-number-value #1", () => {
        // arrange
        const criterion = inSet([1, 2, 3]);
        const template = isValueTemplate([Number]);
        const expected: RemapOneResult = [[isValue(1), isValue(2), isValue(3)]];

        // act
        const actual = criterion.remapOne(template);

        // assert
        expect(actual).toEqual(expected);
    });

    it("in-number-set to is-number-value #2", () => {
        // arrange
        const criterion = inSet([1, 2, 3]);
        const template = new OrCriteriaTemplate([isValueTemplate([Number])]);
        const expected: RemapOneResult = [[or([isValue(1), isValue(2), isValue(3)])]];

        // act
        const actual = criterion.remapOne(template);

        // assert
        expect(actual).toEqual(expected);
    });

    it("named-criteria #1", () => {
        /**
         * { foo: {1,2,3} } remapped to { foo: is-number-value } should be { foo: 1 } | { foo: 2 } | { foo: 3 }
         */
        // arrange
        const criterion = matches({ foo: inSet([1, 2, 3]) });
        const template = new NamedCriteriaTemplate({ foo: [isValueTemplate([Number])] });
        const expected: RemapOneResult = [
            [matches({ foo: isValue(1) }), matches({ foo: isValue(2) }), matches({ foo: isValue(3) })],
        ];

        // act
        const actual = criterion.remapOne(template);

        // assert
        expect(actual).toEqual(expected);
    });

    it("named-criteria #2", () => {
        /**
         * { foo: {1,2}, bar: {4,5} } remapped to { foo: is-number-value, bar: is-number-value } should be { foo: 1, bar: 4 } | { foo: 1, bar: 5 } | { foo: 2, bar: 4 } | { foo: 2, bar: 5 }
         */
        // arrange
        const criterion = matches({ foo: inSet([1, 2]), bar: inSet([4, 5]) });
        const template = new NamedCriteriaTemplate({
            foo: [isValueTemplate([Number])],
            bar: [isValueTemplate([Number])],
        });

        const expected: RemapOneResult = [
            [
                matches({ foo: isValue(1), bar: isValue(4) }),
                matches({ foo: isValue(1), bar: isValue(5) }),
                matches({ foo: isValue(2), bar: isValue(4) }),
                matches({ foo: isValue(2), bar: isValue(5) }),
            ],
        ];

        // act
        const [remapped, open] = criterion.remapOne(template);

        // assert
        // expect(remapped).toEqual(jasmine.arrayWithExactContents(expected[0]));
        expect((remapped as []).length).toEqual(expected[0].length);
        expect(remapped).toEqual(expect.arrayContaining(expected[0]));
        expect(open).toEqual(void 0);
    });

    it("named-criteria #3", () => {
        /**
         * { foo: {1,2}, bar: { baz: {4,5} } } remapped to { foo: is-number-value, bar: { baz: is-number-value } }
         * should be
         * { foo: 1, bar: { baz: 4 } } | { foo: 1, bar: { baz: 5 } } | { foo: 2, bar: { baz: 4 } } | { foo: 2, bar: { baz: 5 } }
         */
        // arrange
        const criterion = matches({ foo: inSet([1, 2]), bar: matches({ baz: inSet([4, 5]) }) });
        const template = new NamedCriteriaTemplate({
            foo: [isValueTemplate([Number])],
            bar: [new NamedCriteriaTemplate({ baz: [isValueTemplate([Number])] })],
        });

        const expected: RemapOneResult = [
            [
                matches({ foo: isValue(1), bar: matches({ baz: isValue(4) }) }),
                matches({ foo: isValue(1), bar: matches({ baz: isValue(5) }) }),
                matches({ foo: isValue(2), bar: matches({ baz: isValue(4) }) }),
                matches({ foo: isValue(2), bar: matches({ baz: isValue(5) }) }),
            ],
        ];

        // act
        const [remapped, open] = criterion.remapOne(template);

        // assert
        // expect(remapped).toEqual(jasmine.arrayWithExactContents(expected[0]));
        expect((remapped as []).length).toEqual(expected[0].length);
        expect(remapped).toEqual(expect.arrayContaining(expected[0]));
        expect(open).toEqual(void 0);
    });

    it("named-criteria #4", () => {
        /**
         * { foo: ([1, 7] | [13, 37]) } remapped to { foo: is-number-range }
         * should be
         * { foo: [1, 7] } | { foo: [13, 37] }
         */
        // arrange
        const criterion = matches({ foo: or(inRange(1, 7), inRange(13, 37)) });
        const template = new NamedCriteriaTemplate({ foo: [InNumberRangeCriterion] });

        const expected: RemapOneResult = [[matches({ foo: inRange(1, 7) }), matches({ foo: inRange(13, 37) })]];

        // act
        const [remapped, open] = criterion.remapOne(template);

        // assert
        // expect(remapped).toEqual(jasmine.arrayWithExactContents(expected[0]));
        expect((remapped as []).length).toEqual(expected[0].length);
        expect(remapped).toEqual(expect.arrayContaining(expected[0]));
        expect(open).toEqual(void 0);
    });
});
