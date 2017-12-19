import { Filter } from "./filter";

function filter(criterion: Filter.Criterion): Filter {
    return new Filter({ foo: criterion });
}

function get(filter: Filter): Filter.Criterion {
    return filter.criteria.foo;
}

function expectArray(filter: Filter) {
    return expect(Array.from((get(filter) as Filter.SetCriterion).values as Set<any>));
}

function expectCriteria(filter: Filter) {
    return expect(get(filter));
}

describe("filter", () => {
    it("length property should reflect number of criteria", () => {
        let zero = new Filter({});

        let three = new Filter({
            foo: { op: "==", type: "number", value: 7 },
            bar: { op: "==", type: "number", value: 64 },
            baz: { op: "==", type: "number", value: 128 }
        });

        expect(zero.length).toBe(0);
        expect(three.length).toBe(3);
    });

    describe("filter()", () => {
        it("should filter an array of items", () => {
            interface Item { id: number; flag: boolean; date: Date; }

            let expected: Item[] = [
                { id: 2, flag: true, date: new Date(2017, 4) },
                { id: 4, flag: null, date: new Date(2017, 7) }
            ];

            let items: Item[] = [
                { id: 1, flag: true, date: new Date(2017, 3) }, // date doesn't match
                { id: 3, flag: false, date: new Date(2017, 7) }, // flag doesn't match
                { id: 5, flag: false, date: new Date(2017, 8) }, // nothing matches
                ...expected
            ];

            let filter = new Filter({
                // id: { op: "in", type: "number", values: new Set([1, 2, 3, 4]), },
                flag: { op: "!=", type: "bool", value: false },
                date: { op: "from-to", type: "date", range: [new Date(2017, 4), new Date(2017, 7)] }
            });

            expect(filter.filter(items)).toEqual(expected);
        });
    });

    describe("reduce()", () => {
        {
            it("throws if criterion operation hasn't been implemented yet", () => {
                let invalidFilter = filter({ op: "i-will-never-exist-in-the-future" as any, type: "bool", value: true });
                let validFilter = filter(Filter.equals(true));

                expect(() => invalidFilter.reduce(validFilter)).toThrow();
            });

            it("throws if types of criteria are incompatible", () => {
                let bool = filter(Filter.equals(true));
                let number = filter(Filter.equals(7));

                expect(() => bool.reduce(number)).toThrow();
            });

            it("should not reduce if one criteria is completely reduced, but another is not reduced at all", () => {
                let a = new Filter({
                    id: { op: "==", type: "number", value: 1 },
                    rank: { op: "<", type: "number", value: 64, step: 1 }
                });

                let b = new Filter({
                    id: { op: "==", type: "number", value: 1 },
                    rank: { op: ">", type: "number", value: 64, step: 1 }
                });

                expect(a.reduce(b)).toBe(b);
            });

            it("should not reduce if both criteria were only partially reduced", () => {
                let a = new Filter({
                    id: { op: "<", type: "number", value: 7, step: 1 },
                    rank: { op: "<", type: "number", value: 64, step: 1 }
                });

                let b = new Filter({
                    id: { op: "<", type: "number", value: 9, step: 1 },
                    rank: { op: ">", type: "number", value: 64, step: 1 }
                });

                expect(a.reduce(b)).toBe(b);
            });

            it("should not kill fully reduced criteria if other criteria were only partially reduced", () => {
                let a = new Filter({
                    id: { op: "==", type: "number", value: 1 },
                    rank: { op: "<", type: "number", value: 64, step: 1 }
                });

                let b = new Filter({
                    id: { op: "==", type: "number", value: 1 },
                    rank: { op: "<", type: "number", value: 128, step: 1 }
                });

                expect(a.reduce(b)).toEqual(new Filter({
                    id: { op: "==", type: "number", value: 1 },
                    rank: { op: "from-to", type: "number", range: [64, 127], step: 1 }
                }));
            });
        }

        describe("==", () => {
            describe("bool", () => {
                let isTrue = filter(Filter.equals(true));

                it("== / !=", () => {
                    // the only case it'll reduce
                    let isAlsoTrue = filter(Filter.equals(true));
                    expect(isTrue.reduce(isAlsoTrue)).toBeNull();

                    let isFalse = filter(Filter.equals(false));
                    expect(isTrue.reduce(isFalse)).toEqual(isFalse);

                    let isNotFalse = filter(Filter.notEquals(false));
                    expectCriteria(isTrue.reduce(isNotFalse)).toEqual({ op: "==", type: "bool", value: null });

                    let notTrue = filter(Filter.notEquals(true));
                    expect(isTrue.reduce(notTrue)).toEqual(notTrue);

                    let isNull = filter(Filter.isNull("bool"));
                    expect(isTrue.reduce(isNull)).toEqual(isNull);

                    let isNotNull = filter(Filter.notNull("bool"));
                    expectCriteria(isTrue.reduce(isNotNull)).toEqual({ op: "==", type: "bool", value: false });
                });

                it("in / not-in", () => {
                    {
                        // in
                        let completely = filter(Filter.memberOf([true]));
                        let transformed = filter(Filter.memberOf([true, false]));
                        let partially = filter(Filter.memberOf([true, false, null]));
                        let untouched = filter(Filter.memberOf([false, null]));

                        expect(isTrue.reduce(completely)).toBeNull();
                        expectCriteria(isTrue.reduce(transformed)).toEqual(Filter.equals(false));
                        expectCriteria(isTrue.reduce(partially)).toEqual(Filter.memberOf([false, null]));
                        expect(isTrue.reduce(untouched)).toBe(untouched);
                    }

                    {
                        // not-in
                        let completely = filter(Filter.notMemberOf([false, null]));
                        let transformed = filter(Filter.notMemberOf([false]));
                        let untouched = filter(Filter.notMemberOf([true, null]));

                        expect(isTrue.reduce(completely)).toBeNull();
                        expectCriteria(isTrue.reduce(transformed)).toEqual(Filter.isNull("bool"));
                        // note: not transforming to "equals false" is on purpose
                        expect(isTrue.reduce(untouched)).toBe(untouched);
                    }
                });
            });

            describe("number", () => {
                let is7 = filter(Filter.equals(7));

                it("== / !=", () => {
                    let alsoIs7 = filter(Filter.equals(7));
                    expect(is7.reduce(alsoIs7)).toBeNull();

                    let is8 = filter(Filter.equals(8));
                    expect(is7.reduce(is8)).toBe(is8);

                    let not6 = filter(Filter.notEquals(6));
                    expect(is7.reduce(not6)).toBe(not6);

                    let isNull = filter(Filter.isNull("number"));
                    expect(is7.reduce(isNull)).toBe(isNull);
                });

                it("< / <= / > / >=", () => {
                    // reduces
                    {
                        let lessThan8 = filter(Filter.less(8, 1));
                        let lessThanEquals7 = filter(Filter.lessEquals(7, 1));
                        let greaterThan6 = filter(Filter.greater(6, 1));
                        let greaterThanEquals7 = filter(Filter.greaterEquals(7));

                        expectCriteria(is7.reduce(lessThan8)).toEqual(Filter.less(7));
                        expectCriteria(is7.reduce(lessThanEquals7)).toEqual(Filter.less(7));
                        expectCriteria(is7.reduce(greaterThan6)).toEqual(Filter.greater(7));
                        expectCriteria(is7.reduce(greaterThanEquals7)).toEqual(Filter.greater(7));
                    }

                    // reduces: w/ step
                    {
                        let lessThan7p1 = filter({ op: "<", type: "number", value: 7.1, step: 0.1 });
                        expectCriteria(is7.reduce(lessThan7p1)).toEqual({ op: "<", type: "number", value: 7, step: 0.1 });

                        let greaterThan6p9 = filter({ op: ">", type: "number", value: 6.9, step: 0.1 });
                        expectCriteria(is7.reduce(greaterThan6p9)).toEqual({ op: ">", type: "number", value: 7, step: 0.1 });
                    }

                    // does'nt reduce: lower bound
                    {
                        let lessThan = filter({ op: "<", type: "number", value: 7, step: 1 });
                        expect(is7.reduce(lessThan)).toEqual(lessThan);

                        let lessThanEquals = filter({ op: "<=", type: "number", value: 6, step: 1 });
                        expect(is7.reduce(lessThanEquals)).toEqual(lessThanEquals);

                        let greaterThan = filter({ op: ">", type: "number", value: 7, step: 1 });
                        expect(is7.reduce(greaterThan)).toEqual(greaterThan);

                        let greaterThanEquals = filter({ op: ">=", type: "number", value: 8, step: 1 });
                        expect(is7.reduce(greaterThanEquals)).toEqual(greaterThanEquals);
                    }

                    // does'nt reduce: higher bound
                    {
                        let lessThan = filter({ op: "<", type: "number", value: 9, step: 1 });
                        expect(is7.reduce(lessThan)).toEqual(lessThan);

                        let lessThanEquals = filter({ op: "<=", type: "number", value: 8, step: 1 });
                        expect(is7.reduce(lessThanEquals)).toEqual(lessThanEquals);

                        let greaterThan = filter({ op: ">", type: "number", value: 5, step: 1 });
                        expect(is7.reduce(greaterThan)).toEqual(greaterThan);

                        let greaterThanEquals = filter({ op: ">=", type: "number", value: 6, step: 1 });
                        expect(is7.reduce(greaterThanEquals)).toEqual(greaterThanEquals);
                    }
                });

                it("in / not-in", () => {
                    {
                        // in
                        let completely = filter(Filter.memberOf([7]));
                        let transformed = filter(Filter.memberOf([7, 64]));
                        let partially = filter(Filter.memberOf([-3, 7, 64]));
                        let untouched = filter(Filter.memberOf([-3, 64]));

                        expect(is7.reduce(completely)).toBeNull();
                        expectCriteria(is7.reduce(transformed)).toEqual(Filter.equals(64));
                        expectCriteria(is7.reduce(partially)).toEqual(Filter.memberOf([-3, 64]));
                        expect(is7.reduce(untouched)).toBe(untouched);
                    }

                    {
                        // not-in
                        let transformed = filter(Filter.notMemberOf([8]));
                        let untouched = filter(Filter.notMemberOf([7, 64]));

                        expectCriteria(is7.reduce(transformed)).toEqual(Filter.notMemberOf([8, 7]));
                        expect(is7.reduce(untouched)).toBe(untouched);
                    }
                });

                it("from-to", () => {
                    let lowerBound = filter(Filter.inRange(7, 64));
                    let higherBound = filter(Filter.inRange(-13, 7));
                    let untouched = filter(Filter.inRange(8, 64));

                    expectCriteria(is7.reduce(lowerBound)).toEqual(Filter.inRange(8, 64));
                    expectCriteria(is7.reduce(higherBound)).toEqual(Filter.inRange(-13, 6));
                    expect(is7.reduce(untouched)).toBe(untouched);
                });

                it("untouched due to null w/ point criterion", () => {
                    let isNull = filter(Filter.isNull("number"));

                    let lessThan3 = filter(Filter.less(3));
                    expect(isNull.reduce(lessThan3)).toBe(lessThan3);
                });
            });

            describe("string", () => {
                let isFoo = filter(Filter.equals("foo"));

                it("== / !=", () => {
                    {
                        // ==
                        let completely = filter(Filter.equals("foo"));
                        let untouched = filter(Filter.equals("bar"));
                        let isNull = filter(Filter.isNull("string"));

                        expect(isFoo.reduce(completely)).toBeNull();
                        expect(isFoo.reduce(untouched)).toBe(untouched);
                        expect(isFoo.reduce(isNull)).toBe(isNull);
                    }

                    {
                        // !=
                        let notBar = filter(Filter.notEquals("bar"));
                        expect(isFoo.reduce(notBar)).toBe(notBar);
                    }
                });

                it("< / <= / > / >=", () => {
                    {
                        // <
                        let untouched = filter(Filter.less("bar"));
                        expect(isFoo.reduce(untouched)).toBe(untouched);
                    }

                    {
                        // <= 
                        let partially = filter(Filter.lessEquals("foo"));
                        let untouched = filter(Filter.lessEquals("bar"));

                        expectCriteria(isFoo.reduce(partially)).toEqual(Filter.less("foo"));
                        expect(isFoo.reduce(untouched)).toBe(untouched);
                    }

                    {
                        // >
                        let untouched = filter(Filter.greater("bar"));
                        expect(isFoo.reduce(untouched)).toBe(untouched);
                    }

                    {
                        // >=
                        let partially = filter(Filter.greaterEquals("foo"));
                        let untouched = filter(Filter.greaterEquals("bar"));

                        expectCriteria(isFoo.reduce(partially)).toEqual(Filter.greater("foo"));
                        expect(isFoo.reduce(untouched)).toBe(untouched);
                    }

                });

                it("in / not-in", () => {
                    {
                        // in
                        let completely = filter(Filter.memberOf(["foo"]));
                        let transformed = filter(Filter.memberOf(["foo", "bar"]));
                        let partially = filter(Filter.memberOf(["foo", "bar", "baz"]));
                        let untouched = filter(Filter.memberOf(["bar", "baz"]));

                        expect(isFoo.reduce(completely)).toBeNull();
                        expectCriteria(isFoo.reduce(transformed)).toEqual(Filter.equals("bar"));
                        expectCriteria(isFoo.reduce(partially)).toEqual(Filter.memberOf(["bar", "baz"]));
                        expect(isFoo.reduce(untouched)).toBe(untouched);
                    }

                    {
                        // not-in
                        let transformed = filter(Filter.notMemberOf(["bar"]));
                        let untouched = filter(Filter.notMemberOf(["foo", "bar"]));

                        expectCriteria(isFoo.reduce(transformed)).toEqual(Filter.notMemberOf(["bar", "foo"]));
                        expect(isFoo.reduce(untouched)).toBe(untouched);
                    }
                });

                it("untouched due to null w/ point criterion", () => {
                    let isNull = filter(Filter.isNull("string"));

                    let lessThanFoo = filter(Filter.less("foo"));
                    expect(isNull.reduce(lessThanFoo)).toBe(lessThanFoo);
                });
            });
        });

        describe("!=", () => {
            describe("bool", () => {
                it("== / !=", () => {
                    let notTrue = filter(Filter.notEquals(true));

                    let alsoNotTrue = filter(Filter.notEquals(true));
                    expect(notTrue.reduce(alsoNotTrue)).toBeNull();

                    let isFalse = filter(Filter.equals(false));
                    expect(notTrue.reduce(isFalse)).toBeNull();

                    let isNull = filter(Filter.isNull("bool"));
                    expect(notTrue.reduce(isNull)).toBeNull();

                    let isTrue = filter(Filter.equals(true));
                    expect(notTrue.reduce(isTrue)).toEqual(isTrue);

                    let notFalse = filter(Filter.notEquals(false));
                    expectCriteria(notTrue.reduce(notFalse)).toEqual({ op: "==", type: "bool", value: true });

                    let notNull = filter(Filter.notNull("bool"));
                    expectCriteria(notTrue.reduce(notNull)).toEqual({ op: "==", type: "bool", value: true });
                });
            });
        });

        describe("<", () => {
            describe("number", () => {
                let lessThan7 = filter(Filter.less(7));

                it("== / !=", () => {
                    // ==
                    let equals3 = filter(Filter.equals(3));
                    let equals7 = filter(Filter.equals(7));

                    expect(lessThan7.reduce(equals3)).toBeNull();
                    expect(lessThan7.reduce(equals7)).toBe(equals7);

                    // !=
                    let not3 = filter(Filter.notEquals(3));
                    let not7 = filter(Filter.notEquals(3));
                    let not8 = filter(Filter.notEquals(8));

                    // todo: inconsistent behaviour between "!=" and "not-in"
                    expectCriteria(lessThan7.reduce(not3)).toEqual(Filter.greaterEquals(7));
                    expectCriteria(lessThan7.reduce(not7)).toEqual(Filter.greaterEquals(7));
                    expectCriteria(lessThan7.reduce(not8)).toEqual(Filter.greaterEquals(7));
                });

                it("< / <=", () => {
                    // <
                    let lessThan3 = filter(Filter.less(3));
                    let alsoLessThan7 = filter(Filter.less(7));
                    let lessThan8 = filter(Filter.less(8));
                    let lessThan9 = filter(Filter.less(9));

                    expect(lessThan7.reduce(lessThan3)).toBeNull();
                    expect(lessThan7.reduce(alsoLessThan7)).toBeNull();
                    expectCriteria(lessThan7.reduce(lessThan8)).toEqual(Filter.equals(7));
                    expectCriteria(lessThan7.reduce(lessThan9)).toEqual(Filter.inRange(7, 8));

                    // <=
                    let lessThanEquals3 = filter(Filter.lessEquals(3));
                    let lessThanEquals7 = filter(Filter.lessEquals(7));
                    let lessThanEquals8 = filter(Filter.lessEquals(8));

                    expect(lessThan7.reduce(lessThanEquals3)).toBeNull();
                    expectCriteria(lessThan7.reduce(lessThanEquals7)).toEqual(Filter.equals(7));
                    expectCriteria(lessThan7.reduce(lessThanEquals8)).toEqual(Filter.inRange(7, 8));
                });

                it("> / >=", () => {
                    // >
                    let greaterThan3 = filter(Filter.greater(3));
                    let greaterThan6 = filter(Filter.greater(6));

                    expectCriteria(lessThan7.reduce(greaterThan3)).toEqual(Filter.greaterEquals(7));
                    expect(lessThan7.reduce(greaterThan6)).toBe(greaterThan6);

                    // >=
                    let greaterEquals6 = filter(Filter.greaterEquals(6));
                    let greaterEquals7 = filter(Filter.greaterEquals(7));

                    expectCriteria(lessThan7.reduce(greaterEquals6)).toEqual(Filter.greaterEquals(7));
                    expect(lessThan7.reduce(greaterEquals7)).toBe(greaterEquals7);
                });

                it("from / to", () => {
                    let from3To6 = filter(Filter.inRange(3, 6));
                    let from3To7 = filter(Filter.inRange(3, 7));
                    let from3To8 = filter(Filter.inRange(3, 8));
                    let from7to64 = filter(Filter.inRange(7, 64));

                    expect(lessThan7.reduce(from3To6)).toBeNull();
                    expectCriteria(lessThan7.reduce(from3To7)).toEqual(Filter.equals(7));
                    expectCriteria(lessThan7.reduce(from3To8)).toEqual(Filter.inRange(7, 8));
                    expect(lessThan7.reduce(from7to64)).toBe(from7to64);
                });

                it("in / not-in", () => {
                    // in
                    let completely = filter(Filter.memberOf([-3, 6]));
                    let transformed = filter(Filter.memberOf([-3, 6, 8]));
                    let partially = filter(Filter.memberOf([-3, 6, 8, 64]));
                    let untouched = filter(Filter.memberOf([8, 64]));

                    expect(lessThan7.reduce(completely)).toBeNull();
                    expectCriteria(lessThan7.reduce(transformed)).toEqual(Filter.equals(8));
                    expectCriteria(lessThan7.reduce(partially)).toEqual(Filter.memberOf([8, 64]));
                    expect(lessThan7.reduce(untouched)).toBe(untouched);

                    // not-in
                    let alwaysUntouched = filter(Filter.notMemberOf([-3, 6]));

                    expect(lessThan7.reduce(alwaysUntouched)).toBe(alwaysUntouched);
                });
            });

            describe("string", () => {
                let lessThanFoo = filter(Filter.less("foo"));

                it("== / !=", () => {
                    // ==
                    let equalsBar = filter(Filter.equals("bar"));
                    let equalsFoo = filter(Filter.equals("foo"));

                    expect(lessThanFoo.reduce(equalsBar)).toBeNull();
                    expect(lessThanFoo.reduce(equalsFoo)).toBe(equalsFoo);

                    // !=
                    let notBar = filter(Filter.notEquals("bar"));
                    let notFoo = filter(Filter.notEquals("foo"));
                    let notBaz = filter(Filter.notEquals("baz"));

                    // todo: inconsistent behaviour between "!=" and "not-in"
                    expectCriteria(lessThanFoo.reduce(notBar)).toEqual(Filter.greaterEquals("foo"));
                    expectCriteria(lessThanFoo.reduce(notFoo)).toEqual(Filter.greaterEquals("foo"));
                    expectCriteria(lessThanFoo.reduce(notBaz)).toEqual(Filter.greaterEquals("foo"));
                });

                it("< / <=", () => {
                    // <
                    let lessBar = filter(Filter.less("bar"));
                    let alsoLessFoo = filter(Filter.less("foo"));
                    let lessKhaz = filter(Filter.less("khaz"));

                    expect(lessThanFoo.reduce(lessBar)).toBeNull();
                    expect(lessThanFoo.reduce(alsoLessFoo)).toBeNull();
                    expectCriteria(lessThanFoo.reduce(lessKhaz)).toEqual(Filter.inRange("foo", "khaz"));

                    // <=
                    let lessEqualsBar = filter(Filter.lessEquals("bar"));
                    let lessEqualsFoo = filter(Filter.lessEquals("foo"));
                    let lessEqualsKhaz = filter(Filter.lessEquals("khaz"));

                    expect(lessThanFoo.reduce(lessEqualsBar)).toBeNull();
                    expectCriteria(lessThanFoo.reduce(lessEqualsFoo)).toEqual(Filter.equals("foo"));
                    expectCriteria(lessThanFoo.reduce(lessEqualsKhaz)).toEqual(Filter.inRange("foo", "khaz"));
                });

                it("> / >=", () => {
                    // >
                    let greaterBar = filter(Filter.greater("bar"));
                    let greaterFoo = filter(Filter.greater("foo"));

                    expectCriteria(lessThanFoo.reduce(greaterBar)).toEqual(Filter.greaterEquals("foo"));
                    expect(lessThanFoo.reduce(greaterFoo)).toBe(greaterFoo);

                    // >=
                    let greaterEqualsBar = filter(Filter.greaterEquals("bar"));
                    let greaterEqualsFoo = filter(Filter.greaterEquals("foo"));

                    expectCriteria(lessThanFoo.reduce(greaterEqualsBar)).toEqual(Filter.greaterEquals("foo"));
                    expect(lessThanFoo.reduce(greaterEqualsFoo)).toBe(greaterEqualsFoo);
                });

                it("from / to", () => {
                    let fromBarToBaz = filter(Filter.inRange("bar", "baz"));
                    let fromBarToFoo = filter(Filter.inRange("bar", "foo"));
                    let fromBarToKhaz = filter(Filter.inRange("bar", "khaz"));
                    let fromFooToKhaz = filter(Filter.inRange("foo", "khaz"));

                    expect(lessThanFoo.reduce(fromBarToBaz)).toBeNull();
                    expectCriteria(lessThanFoo.reduce(fromBarToFoo)).toEqual(Filter.equals("foo"));
                    expectCriteria(lessThanFoo.reduce(fromBarToKhaz)).toEqual(Filter.inRange("foo", "khaz"));
                    expect(lessThanFoo.reduce(fromFooToKhaz)).toBe(fromFooToKhaz);
                });

                it("in / not-in", () => {
                    // in
                    let completely = filter(Filter.memberOf(["bar", "baz"]));
                    let transformed = filter(Filter.memberOf(["bar", "baz", "khaz"]));
                    let partially = filter(Filter.memberOf(["bar", "baz", "khaz", "mo"]));
                    let untouched = filter(Filter.memberOf(["khaz", "mo"]));

                    expect(lessThanFoo.reduce(completely)).toBeNull();
                    expectCriteria(lessThanFoo.reduce(transformed)).toEqual(Filter.equals("khaz"));
                    expectCriteria(lessThanFoo.reduce(partially)).toEqual(Filter.memberOf(["khaz", "mo"]));
                    expect(lessThanFoo.reduce(untouched)).toBe(untouched);

                    // not-in
                    let alwaysUntouched = filter(Filter.notMemberOf(["foo", "bar"]));

                    expect(lessThanFoo.reduce(alwaysUntouched)).toBe(alwaysUntouched);
                });
            });
        });

        describe("<=", () => {
            describe("number", () => {
                let lessEquals7 = filter(Filter.lessEquals(7));

                it("== / !=", () => {
                    // ==
                    let equals3 = filter(Filter.equals(3));
                    let equals7 = filter(Filter.equals(7));
                    let equals8 = filter(Filter.equals(8));

                    expect(lessEquals7.reduce(equals3)).toBeNull();
                    expect(lessEquals7.reduce(equals7)).toBeNull();
                    expect(lessEquals7.reduce(equals8)).toBe(equals8);

                    // !=
                    let not3 = filter(Filter.notEquals(3));
                    let not7 = filter(Filter.notEquals(3));
                    let not8 = filter(Filter.notEquals(8));

                    // todo: inconsistent behaviour between "!=" and "not-in"
                    expectCriteria(lessEquals7.reduce(not3)).toEqual(Filter.greater(7));
                    expectCriteria(lessEquals7.reduce(not7)).toEqual(Filter.greater(7));
                    expectCriteria(lessEquals7.reduce(not8)).toEqual(Filter.greater(7));
                });

                it("< / <=", () => {
                    // <
                    let less3 = filter(Filter.less(3));
                    let less7 = filter(Filter.less(7));
                    let less8 = filter(Filter.less(8));
                    let less9 = filter(Filter.less(9));
                    let less10 = filter(Filter.less(10));

                    expect(lessEquals7.reduce(less3)).toBeNull();
                    expect(lessEquals7.reduce(less7)).toBeNull();
                    expect(lessEquals7.reduce(less8)).toBeNull();
                    expectCriteria(lessEquals7.reduce(less9)).toEqual(Filter.equals(8));
                    expectCriteria(lessEquals7.reduce(less10)).toEqual(Filter.inRange(8, 9));

                    // <=
                    let lessEquals3 = filter(Filter.lessEquals(3));
                    let alsoLessEquals7 = filter(Filter.lessEquals(7));
                    let lessEquals8 = filter(Filter.lessEquals(8));
                    let lessEquals9 = filter(Filter.lessEquals(9));

                    expect(lessEquals7.reduce(lessEquals3)).toBeNull();
                    expect(lessEquals7.reduce(alsoLessEquals7)).toBeNull();
                    expectCriteria(lessEquals7.reduce(lessEquals8)).toEqual(Filter.equals(8));
                    expectCriteria(lessEquals7.reduce(lessEquals9)).toEqual(Filter.inRange(8, 9));
                });

                it("> / >=", () => {
                    // >
                    let greater3 = filter(Filter.greater(3));
                    let greater7 = filter(Filter.greater(7));

                    expectCriteria(lessEquals7.reduce(greater3)).toEqual(Filter.greater(7));
                    expect(lessEquals7.reduce(greater7)).toBe(greater7);

                    // >=
                    let greaterEquals7 = filter(Filter.greaterEquals(7));
                    let greaterEquals8 = filter(Filter.greaterEquals(8));

                    expectCriteria(lessEquals7.reduce(greaterEquals7)).toEqual(Filter.greater(7));
                    expect(lessEquals7.reduce(greaterEquals8)).toBe(greaterEquals8);
                });

                it("from / to", () => {
                    let from3To7 = filter(Filter.inRange(3, 7));
                    let from3To8 = filter(Filter.inRange(3, 8));
                    let from3To9 = filter(Filter.inRange(3, 9));
                    let from8to64 = filter(Filter.inRange(8, 64));

                    expect(lessEquals7.reduce(from3To7)).toBeNull();
                    expectCriteria(lessEquals7.reduce(from3To8)).toEqual(Filter.equals(8));
                    expectCriteria(lessEquals7.reduce(from3To9)).toEqual(Filter.inRange(8, 9));
                    expect(lessEquals7.reduce(from8to64)).toBe(from8to64);
                });

                it("in / not-in", () => {
                    // in
                    let completely = filter(Filter.memberOf([-3, 7]));
                    let transformed = filter(Filter.memberOf([-3, 7, 8]));
                    let partially = filter(Filter.memberOf([-3, 7, 8, 64]));
                    let untouched = filter(Filter.memberOf([8, 64]));

                    expect(lessEquals7.reduce(completely)).toBeNull();
                    expectCriteria(lessEquals7.reduce(transformed)).toEqual(Filter.equals(8));
                    expectCriteria(lessEquals7.reduce(partially)).toEqual(Filter.memberOf([8, 64]));
                    expect(lessEquals7.reduce(untouched)).toBe(untouched);

                    // not-in
                    let alwaysUntouched = filter(Filter.notMemberOf([-3, 6]));

                    expect(lessEquals7.reduce(alwaysUntouched)).toBe(alwaysUntouched);
                });
            });

            describe("string", () => {
                let lessEqualsFoo = filter(Filter.lessEquals("foo"));

                it("== / !=", () => {
                    // ==
                    let equalsBar = filter(Filter.equals("bar"));
                    let equalsFoo = filter(Filter.equals("foo"));
                    let equalsKhaz = filter(Filter.equals("khaz"));

                    expect(lessEqualsFoo.reduce(equalsBar)).toBeNull();
                    expect(lessEqualsFoo.reduce(equalsFoo)).toBeNull();
                    expect(lessEqualsFoo.reduce(equalsKhaz)).toBe(equalsKhaz);

                    // !=
                    let notBar = filter(Filter.notEquals("bar"));
                    let notFoo = filter(Filter.notEquals("foo"));
                    let notBaz = filter(Filter.notEquals("baz"));

                    // todo: inconsistent behaviour between "!=" and "not-in"
                    expectCriteria(lessEqualsFoo.reduce(notBar)).toEqual(Filter.greater("foo"));
                    expectCriteria(lessEqualsFoo.reduce(notFoo)).toEqual(Filter.greater("foo"));
                    expectCriteria(lessEqualsFoo.reduce(notBaz)).toEqual(Filter.greater("foo"));
                });

                it("< / <=", () => {
                    // <
                    let lessBar = filter(Filter.less("bar"));
                    let lessFoo = filter(Filter.less("foo"));
                    let lessKhaz = filter(Filter.less("khaz"));

                    expect(lessEqualsFoo.reduce(lessBar)).toBeNull();
                    expect(lessEqualsFoo.reduce(lessFoo)).toBeNull();
                    expectCriteria(lessEqualsFoo.reduce(lessKhaz)).toEqual(Filter.inRange("foo", "khaz"));

                    // <=
                    let lessEqualsBar = filter(Filter.lessEquals("bar"));
                    let alsoLessEqualsFoo = filter(Filter.lessEquals("foo"));
                    let lessEqualsKhaz = filter(Filter.lessEquals("khaz"));

                    expect(lessEqualsFoo.reduce(lessEqualsBar)).toBeNull();
                    expect(lessEqualsFoo.reduce(alsoLessEqualsFoo)).toBeNull();
                    expectCriteria(lessEqualsFoo.reduce(lessEqualsKhaz)).toEqual(Filter.inRange("foo", "khaz"));
                });

                it("> / >=", () => {
                    // >
                    let greaterBar = filter(Filter.greater("bar"));
                    let greaterFoo = filter(Filter.greater("foo"));

                    expectCriteria(lessEqualsFoo.reduce(greaterBar)).toEqual(Filter.greater("foo"));
                    expect(lessEqualsFoo.reduce(greaterFoo)).toBe(greaterFoo);

                    // >=
                    let greaterEqualsBar = filter(Filter.greaterEquals("bar"));
                    let greaterEqualsFoo = filter(Filter.greaterEquals("foo"));
                    let greaterEqualsKhaz = filter(Filter.greaterEquals("khaz"));

                    expectCriteria(lessEqualsFoo.reduce(greaterEqualsBar)).toEqual(Filter.greater("foo"));
                    expectCriteria(lessEqualsFoo.reduce(greaterEqualsFoo)).toEqual(Filter.greater("foo"));
                    expect(lessEqualsFoo.reduce(greaterEqualsKhaz)).toBe(greaterEqualsKhaz);
                });

                it("from / to", () => {
                    let fromBarToBaz = filter(Filter.inRange("bar", "baz"));
                    let fromBarToFoo = filter(Filter.inRange("bar", "foo"));
                    let fromBarToKhaz = filter(Filter.inRange("bar", "khaz"));
                    let fromFooToKhaz = filter(Filter.inRange("foo", "khaz"));

                    expect(lessEqualsFoo.reduce(fromBarToBaz)).toBeNull();
                    expect(lessEqualsFoo.reduce(fromBarToFoo)).toBeNull();
                    expectCriteria(lessEqualsFoo.reduce(fromBarToKhaz)).toEqual(Filter.inRange("foo", "khaz"));
                    expect(lessEqualsFoo.reduce(fromFooToKhaz)).toBe(fromFooToKhaz);
                });

                it("in / not-in", () => {
                    // in
                    let completely = filter(Filter.memberOf(["bar", "foo"]));
                    let transformed = filter(Filter.memberOf(["bar", "foo", "khaz"]));
                    let partially = filter(Filter.memberOf(["bar", "foo", "khaz", "mo"]));
                    let untouched = filter(Filter.memberOf(["khaz", "mo"]));

                    expect(lessEqualsFoo.reduce(completely)).toBeNull();
                    expectCriteria(lessEqualsFoo.reduce(transformed)).toEqual(Filter.equals("khaz"));
                    expectCriteria(lessEqualsFoo.reduce(partially)).toEqual(Filter.memberOf(["khaz", "mo"]));
                    expect(lessEqualsFoo.reduce(untouched)).toBe(untouched);

                    // not-in
                    let alwaysUntouched = filter(Filter.notMemberOf(["foo", "bar"]));

                    expect(lessEqualsFoo.reduce(alwaysUntouched)).toBe(alwaysUntouched);
                });
            });
        });

        describe(">", () => {
            describe("number", () => {
                let greater7 = filter(Filter.greater(7));

                it("== / !=", () => {
                    // ==
                    let equals8 = filter(Filter.equals(8));
                    let equals7 = filter(Filter.equals(7));

                    expect(greater7.reduce(equals8)).toBeNull();
                    expect(greater7.reduce(equals7)).toBe(equals7);

                    // !=
                    let not3 = filter(Filter.notEquals(3));
                    let not7 = filter(Filter.notEquals(3));
                    let not8 = filter(Filter.notEquals(8));

                    // todo: inconsistent behaviour between "!=" and "not-in"
                    expectCriteria(greater7.reduce(not3)).toEqual(Filter.lessEquals(7));
                    expectCriteria(greater7.reduce(not7)).toEqual(Filter.lessEquals(7));
                    expectCriteria(greater7.reduce(not8)).toEqual(Filter.lessEquals(7));
                });

                it("< / <=", () => {
                    // <
                    let lessThan9 = filter(Filter.less(9));
                    let lessThan6 = filter(Filter.less(6));

                    expectCriteria(greater7.reduce(lessThan9)).toEqual(Filter.lessEquals(7));
                    expect(greater7.reduce(lessThan6)).toBe(lessThan6);

                    // <=
                    let lessEquals9 = filter(Filter.lessEquals(9));
                    let lessEquals6 = filter(Filter.lessEquals(6));

                    expectCriteria(greater7.reduce(lessEquals9)).toEqual(Filter.lessEquals(7));
                    expect(greater7.reduce(lessEquals6)).toBe(lessEquals6);
                });

                it("> / >=", () => {
                    // >
                    let greater9 = filter(Filter.greater(9));
                    let greater6 = filter(Filter.greater(6));
                    let greater5 = filter(Filter.greater(5));

                    expect(greater7.reduce(greater9)).toBeNull();
                    expectCriteria(greater7.reduce(greater6)).toEqual(Filter.equals(7));
                    expectCriteria(greater7.reduce(greater5)).toEqual(Filter.inRange(6, 7));

                    // >=
                    let geaterEquals8 = filter(Filter.greaterEquals(8));
                    let geaterEquals7 = filter(Filter.greaterEquals(7));
                    let geaterEquals6 = filter(Filter.greaterEquals(6));

                    expect(greater7.reduce(geaterEquals8)).toBeNull();
                    expectCriteria(greater7.reduce(geaterEquals7)).toEqual(Filter.equals(7));
                    expectCriteria(greater7.reduce(geaterEquals6)).toEqual(Filter.inRange(6, 7));
                });

                it("from / to", () => {
                    let from8to9 = filter(Filter.inRange(8, 9));
                    let from7To9 = filter(Filter.inRange(7, 9));
                    let from6to8 = filter(Filter.inRange(6, 8));
                    let from1to7 = filter(Filter.inRange(1, 7));

                    expect(greater7.reduce(from8to9)).toBeNull();
                    expectCriteria(greater7.reduce(from7To9)).toEqual(Filter.equals(7));
                    expectCriteria(greater7.reduce(from6to8)).toEqual(Filter.inRange(6, 7));
                    expect(greater7.reduce(from1to7)).toBe(from1to7);
                });

                it("in / not-in", () => {
                    // in
                    let completely = filter(Filter.memberOf([13, 37]));
                    let transformed = filter(Filter.memberOf([0, 13, 37]));
                    let partially = filter(Filter.memberOf([-3, 0, 13, 37]));
                    let untouched = filter(Filter.memberOf([-8, -64]));

                    expect(greater7.reduce(completely)).toBeNull();
                    expectCriteria(greater7.reduce(transformed)).toEqual(Filter.equals(0));
                    expectCriteria(greater7.reduce(partially)).toEqual(Filter.memberOf([-3, 0]));
                    expect(greater7.reduce(untouched)).toBe(untouched);

                    // not-in
                    let alwaysUntouched = filter(Filter.notMemberOf([-3, 6]));

                    expect(greater7.reduce(alwaysUntouched)).toBe(alwaysUntouched);
                });
            });

            describe("string", () => {
                let greaterFoo = filter(Filter.greater("foo"));

                it("== / !=", () => {
                    // ==
                    let equalsFoo = filter(Filter.equals("foo"));
                    let equalsKhaz = filter(Filter.equals("khaz"));

                    expect(greaterFoo.reduce(equalsFoo)).toBe(equalsFoo);
                    expect(greaterFoo.reduce(equalsKhaz)).toBeNull();

                    // !=
                    let notBar = filter(Filter.notEquals("bar"));
                    let notFoo = filter(Filter.notEquals("foo"));
                    let notBaz = filter(Filter.notEquals("baz"));

                    // todo: inconsistent behaviour between "!=" and "not-in"
                    expectCriteria(greaterFoo.reduce(notBar)).toEqual(Filter.lessEquals("foo"));
                    expectCriteria(greaterFoo.reduce(notFoo)).toEqual(Filter.lessEquals("foo"));
                    expectCriteria(greaterFoo.reduce(notBaz)).toEqual(Filter.lessEquals("foo"));
                });

                it("< / <=", () => {
                    // <
                    let lessKhaz = filter(Filter.less("khaz"));
                    let lessFoo = filter(Filter.less("foo"));

                    expectCriteria(greaterFoo.reduce(lessKhaz)).toEqual(Filter.lessEquals("foo"));
                    expect(greaterFoo.reduce(lessFoo)).toBe(lessFoo);

                    // <=
                    let lessEqualsKhaz = filter(Filter.lessEquals("khaz"));
                    let lessEqualsFoo = filter(Filter.lessEquals("foo"));

                    expectCriteria(greaterFoo.reduce(lessEqualsKhaz)).toEqual(Filter.lessEquals("foo"));
                    expect(greaterFoo.reduce(lessEqualsFoo)).toBe(lessEqualsFoo);
                });

                it("> / >=", () => {
                    // >
                    let greaterKhaz = filter(Filter.greater("khaz"));
                    let alsoGreaterFoo = filter(Filter.greater("foo"));
                    let greaterBar = filter(Filter.greater("bar"));

                    expect(greaterFoo.reduce(greaterKhaz)).toBeNull();
                    expect(greaterFoo.reduce(alsoGreaterFoo)).toBeNull();
                    expectCriteria(greaterFoo.reduce(greaterBar)).toEqual(Filter.inRange("bar", "foo"));

                    // >=
                    let greaterEqualsKhaz = filter(Filter.greaterEquals("khaz"));
                    let greaterEqualsFoo = filter(Filter.greaterEquals("foo"));
                    let greaterEqualsBar = filter(Filter.greaterEquals("bar"));

                    expect(greaterFoo.reduce(greaterEqualsKhaz)).toBeNull();
                    expectCriteria(greaterFoo.reduce(greaterEqualsFoo)).toEqual(Filter.equals("foo"));
                    expectCriteria(greaterFoo.reduce(greaterEqualsBar)).toEqual(Filter.inRange("bar", "foo"));
                });

                it("from / to", () => {
                    let fromKhazToMo = filter(Filter.inRange("khaz", "mo"));
                    let fromFooToKhaz = filter(Filter.inRange("foo", "khaz"));
                    let fromBarToKhaz = filter(Filter.inRange("bar", "khaz"));
                    let fromBarToFoo = filter(Filter.inRange("bar", "foo"));

                    expect(greaterFoo.reduce(fromKhazToMo)).toBeNull();
                    expectCriteria(greaterFoo.reduce(fromFooToKhaz)).toEqual(Filter.equals("foo"));
                    expectCriteria(greaterFoo.reduce(fromBarToKhaz)).toEqual(Filter.inRange("bar", "foo"));
                    expect(greaterFoo.reduce(fromBarToFoo)).toBe(fromBarToFoo);
                });

                it("in / not-in", () => {
                    // in
                    let completely = filter(Filter.memberOf(["khaz", "mo"]));
                    let transformed = filter(Filter.memberOf(["khaz", "mo", "bar"]));
                    let partially = filter(Filter.memberOf(["khaz", "mo", "bar", "baz"]));
                    let untouched = filter(Filter.memberOf(["bar", "baz"]));

                    expect(greaterFoo.reduce(completely)).toBeNull();
                    expectCriteria(greaterFoo.reduce(transformed)).toEqual(Filter.equals("bar"));
                    expectCriteria(greaterFoo.reduce(partially)).toEqual(Filter.memberOf(["bar", "baz"]));
                    expect(greaterFoo.reduce(untouched)).toBe(untouched);

                    // not-in
                    let alwaysUntouched = filter(Filter.notMemberOf(["foo", "khaz"]));

                    expect(greaterFoo.reduce(alwaysUntouched)).toBe(alwaysUntouched);
                });
            });
        });

        describe(">=", () => {
            describe("number", () => {
                let greaterEquals7 = filter(Filter.greaterEquals(7));

                it("== / !=", () => {
                    // ==
                    let equals7 = filter(Filter.equals(7));
                    let equals6 = filter(Filter.equals(6));

                    expect(greaterEquals7.reduce(equals7)).toBeNull();
                    expect(greaterEquals7.reduce(equals6)).toBe(equals6);

                    // !=
                    let not3 = filter(Filter.notEquals(3));
                    let not7 = filter(Filter.notEquals(3));
                    let not8 = filter(Filter.notEquals(8));

                    // todo: inconsistent behaviour between "!=" and "not-in"
                    expectCriteria(greaterEquals7.reduce(not3)).toEqual(Filter.less(7));
                    expectCriteria(greaterEquals7.reduce(not7)).toEqual(Filter.less(7));
                    expectCriteria(greaterEquals7.reduce(not8)).toEqual(Filter.less(7));
                });

                it("< / <=", () => {
                    // <
                    let lessThan8 = filter(Filter.less(8));
                    let lessThan7 = filter(Filter.less(7));

                    expectCriteria(greaterEquals7.reduce(lessThan8)).toEqual(Filter.less(7));
                    expect(greaterEquals7.reduce(lessThan7)).toBe(lessThan7);

                    // <=
                    let lessEquals7 = filter(Filter.lessEquals(7));
                    let lessEquals6 = filter(Filter.lessEquals(6));

                    expectCriteria(greaterEquals7.reduce(lessEquals7)).toEqual(Filter.less(7));
                    expect(greaterEquals7.reduce(lessEquals6)).toBe(lessEquals6);
                });

                it("> / >=", () => {
                    // >
                    let greater6 = filter(Filter.greater(6));
                    let greater5 = filter(Filter.greater(5));
                    let greater4 = filter(Filter.greater(4));

                    expect(greaterEquals7.reduce(greater6)).toBeNull();
                    expectCriteria(greaterEquals7.reduce(greater5)).toEqual(Filter.equals(6));
                    expectCriteria(greaterEquals7.reduce(greater4)).toEqual(Filter.inRange(5, 6));

                    // >=
                    let geaterEquals9 = filter(Filter.greaterEquals(9));
                    let geaterEquals6 = filter(Filter.greaterEquals(6));
                    let geaterEquals5 = filter(Filter.greaterEquals(5));

                    expect(greaterEquals7.reduce(geaterEquals9)).toBeNull();
                    expectCriteria(greaterEquals7.reduce(geaterEquals6)).toEqual(Filter.equals(6));
                    expectCriteria(greaterEquals7.reduce(geaterEquals5)).toEqual(Filter.inRange(5, 6));
                });

                it("from / to", () => {
                    let from7to9 = filter(Filter.inRange(7, 9));
                    let from6to9 = filter(Filter.inRange(6, 9));
                    let from5to9 = filter(Filter.inRange(5, 9));
                    let from1to6 = filter(Filter.inRange(1, 6));

                    expect(greaterEquals7.reduce(from7to9)).toBeNull();
                    expectCriteria(greaterEquals7.reduce(from6to9)).toEqual(Filter.equals(6));
                    expectCriteria(greaterEquals7.reduce(from5to9)).toEqual(Filter.inRange(5, 6));
                    expect(greaterEquals7.reduce(from1to6)).toBe(from1to6);
                });

                it("in / not-in", () => {
                    // in
                    let completely = filter(Filter.memberOf([7, 8]));
                    let transformed = filter(Filter.memberOf([0, 7, 8]));
                    let partially = filter(Filter.memberOf([-3, 0, 7, 8]));
                    let untouched = filter(Filter.memberOf([-8, -64]));

                    expect(greaterEquals7.reduce(completely)).toBeNull();
                    expectCriteria(greaterEquals7.reduce(transformed)).toEqual(Filter.equals(0));
                    expectCriteria(greaterEquals7.reduce(partially)).toEqual(Filter.memberOf([-3, 0]));
                    expect(greaterEquals7.reduce(untouched)).toBe(untouched);

                    // not-in
                    let alwaysUntouched = filter(Filter.notMemberOf([-3, 6]));

                    expect(greaterEquals7.reduce(alwaysUntouched)).toBe(alwaysUntouched);
                });
            });
        });

        describe("from-to", () => {
            it("from-to", () => {
                let a = filter({ op: "from-to", type: "number", range: [1, 7], step: 1 });

                {
                    // A reduces lower bound of B
                    let b = filter({ op: "from-to", type: "number", range: [3, 9], step: 1 });
                    let r = a.reduce(b);
                    expect(r).not.toBeNull();
                    expect(get(r)).toEqual({ op: "from-to", type: "number", range: [7, 9], step: 1 });
                }

                {
                    // A reduces higher bound of B
                    let b = filter({ op: "from-to", type: "number", range: [-3, 3], step: 1 });
                    let r = a.reduce(b);
                    expect(r).not.toBeNull();
                    expect(get(r)).toEqual({ op: "from-to", type: "number", range: [-3, 1], step: 1 });
                }

                {
                    // A completely reduces B due to being greater than B
                    let b = filter({ op: "from-to", type: "number", range: [2, 6], step: 1 });
                    let r = a.reduce(b);
                    expect(r).toBeNull();
                }

                {
                    // A completely reduces B due to being equal
                    let b = filter({ op: "from-to", type: "number", range: [1, 7], step: 1 });
                    let r = a.reduce(b);
                    expect(r).toBeNull();
                }

                {
                    // A does not reduce B due to being consumed by B
                    let b = filter({ op: "from-to", type: "number", range: [-3, 9], step: 1 });
                    let r = a.reduce(b);
                    expect(r).not.toBeNull();
                    expect(get(r)).toEqual({ op: "from-to", type: "number", range: [-3, 9], step: 1 });
                }

                {
                    // A does not reduce B due to non-intersecting ranges
                    let b = filter({ op: "from-to", type: "number", range: [-64, 0], step: 1 });
                    let r = a.reduce(b);
                    expect(r).not.toBeNull();
                    expect(r).toEqual(b);
                }
            });

            it("==", () => {
                let a = filter({ op: "from-to", type: "number", range: [1, 7], step: 1 });

                {
                    let b = filter({ op: "==", type: "number", value: 3 });
                    let r = a.reduce(b);
                    expect(r).toBeNull();
                }
            });

            it("<", () => {
                let a = filter({ op: "from-to", type: "number", range: [1, 7], step: 1 });

                {
                    let b = filter({ op: "<", type: "number", value: 2, step: 1 });
                    let r = a.reduce(b);

                    expect(r).not.toBeNull();
                    expect(get(r)).toEqual({ op: "<", type: "number", value: 1, step: 1 });
                }

                {
                    let b = filter({ op: "<", type: "number", value: 8, step: 1 });
                    let r = a.reduce(b);

                    expect(r).not.toBeNull();
                    expect(get(r)).toEqual({ op: "<", type: "number", value: 1, step: 1 });
                }
            });

            it("<=", () => {
                let a = filter({ op: "from-to", type: "number", range: [1, 7], step: 1 });

                {
                    let b = filter({ op: "<=", type: "number", value: 2, step: 1 });
                    let r = a.reduce(b);

                    expect(r).not.toBeNull();
                    expect(get(r)).toEqual({ op: "<", type: "number", value: 1, step: 1 });
                }

                {
                    let b = filter({ op: "<=", type: "number", value: 7, step: 1 });
                    let r = a.reduce(b);

                    expect(r).not.toBeNull();
                    expect(get(r)).toEqual({ op: "<", type: "number", value: 1, step: 1 });
                }
            });

            xit("in / common", () => {
                let a = filter({ op: "from-to", type: "number", range: [1, 7], step: 1 });

                {
                    let include = filter({ op: "in", type: "number", values: new Set([1, 2, 3]) });
                    let intersect = filter({ op: "common", type: "number", values: new Set([1, 2, 3]) });

                    expect(a.reduce(include)).toBeNull();
                    expect(a.reduce(intersect)).toBeNull();
                }

                {
                    let include = filter({ op: "in", type: "number", values: new Set([-1, 2, 3, 64]) });
                    let intersect = filter({ op: "common", type: "number", values: new Set([-1, 2, 3, 64]) });

                    expect(a.reduce(include)).not.toBeNull();
                    expectArray(a.reduce(include)).toEqual([-1, 64]);
                    expect(a.reduce(intersect)).not.toBeNull();
                    expectArray(a.reduce(intersect)).toEqual([-1, 64]);
                }
            });

            it("should not reduce !=", () => {
                let fromTo = filter({ op: "from-to", type: "number", range: [1, 7], step: 1 });
                let notEquals = filter({ op: "!=", type: "number", value: 3 });
                expect(fromTo.reduce(notEquals)).toEqual(notEquals);
            });
        });
    });
});
