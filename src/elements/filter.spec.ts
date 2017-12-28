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

function makeDate(year: number, deltaMs = 0): Date {
    return new Date(Date.UTC(year, 0) + deltaMs);
}

// todo: properly re-check tests for reduce() implementations
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
            // todo: figure out if it makes sense to allow unknown filter ops even though filtering impl. would be missing
            //       reason: user might want to pass query on to api call and filter it on their own
            it("throws if the operation of the reducing criterion hasn't been implemented yet", () => {
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

            describe("date", () => {
                let is2017 = filter(Filter.equals(makeDate(2017)));

                it("== / !=", () => {
                    let alsoIs2017 = filter(Filter.equals(makeDate(2017)));
                    expect(is2017.reduce(alsoIs2017)).toBeNull();

                    let is2018 = filter(Filter.equals(makeDate(2018)));
                    expect(is2017.reduce(is2018)).toBe(is2018);

                    let not2016 = filter(Filter.notEquals(makeDate(2016)));
                    expect(is2017.reduce(not2016)).toBe(not2016);

                    let isNull = filter(Filter.isNull("date"));
                    expect(is2017.reduce(isNull)).toBe(isNull);
                });

                it("< / <= / > / >=", () => {
                    {
                        // <
                        let lessSecondOf2017 = filter(Filter.less(makeDate(2017, 1)));
                        expect(is2017.reduce(lessSecondOf2017)).toBe(lessSecondOf2017);
                    }

                    {
                        // <=
                        let lessEquals2017 = filter(Filter.lessEquals(makeDate(2017)));
                        let lessEqualsSecondOf2017 = filter(Filter.lessEquals(makeDate(2017, 1)));

                        expectCriteria(is2017.reduce(lessEquals2017)).toEqual(Filter.less(makeDate(2017)));
                        expect(is2017.reduce(lessEqualsSecondOf2017)).toBe(lessEqualsSecondOf2017);
                    }

                    {
                        // >
                        let greaterLastOf2016 = filter(Filter.greater(makeDate(2017, -1)));
                        expect(is2017.reduce(greaterLastOf2016)).toBe(greaterLastOf2016);
                    }

                    {
                        // >=
                        let greaterEquals2017 = filter(Filter.greaterEquals(makeDate(2017)));
                        let greaterEqualsLastOf2016 = filter(Filter.greaterEquals(makeDate(2017, -1)));

                        expectCriteria(is2017.reduce(greaterEquals2017)).toEqual(Filter.greater(makeDate(2017)));
                        expect(is2017.reduce(greaterEqualsLastOf2016)).toBe(greaterEqualsLastOf2016);
                    }
                });

                it("untouched due to null w/ point criterion", () => {
                    let isNull = filter(Filter.isNull("date"));
                    let less2017 = filter(Filter.less(makeDate(2017)));

                    expect(isNull.reduce(less2017)).toBe(less2017);
                });
            });
        });

        describe("!=", () => {
            describe("bool", () => {
                let notTrue = filter(Filter.notEquals(true));

                it("== / !=", () => {
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

                it("in / not-in", () => {
                    let inFalseAndNull = filter(Filter.memberOf([false, null]));
                    let inTrueAndFalse = filter(Filter.memberOf([true, false]));

                    expect(notTrue.reduce(inFalseAndNull)).toBeNull();
                    expectCriteria(notTrue.reduce(inTrueAndFalse)).toEqual(Filter.equals(true));

                    let notInTrueAndFalse = filter(Filter.notMemberOf([true, false]));
                    let notInFalseAndNull = filter(Filter.notMemberOf([false, null]));

                    expect(notTrue.reduce(notInTrueAndFalse)).toBeNull();
                    expectCriteria(notTrue.reduce(notInFalseAndNull)).toEqual(Filter.equals(true));
                });
            });

            describe("number", () => {
                let not7 = filter(Filter.notEquals(7));

                it("== / !=", () => {
                    let is3 = filter(Filter.equals(3));
                    let is7 = filter(Filter.equals(7));

                    expect(not7.reduce(is3)).toBeNull();
                    expect(not7.reduce(is7)).toBe(is7);

                    let not3 = filter(Filter.notEquals(3));
                    let alsoNot7 = filter(Filter.notEquals(7));

                    expectCriteria(not7.reduce(not3)).toEqual(Filter.equals(7));
                    expect(not7.reduce(alsoNot7)).toBeNull();
                });

                it("< / <= / > / >=", () => {
                    {
                        // <
                        let less3 = filter(Filter.less(3));
                        let less7 = filter(Filter.less(7));
                        let less8 = filter(Filter.less(8));

                        expect(not7.reduce(less3)).toBeNull();
                        expect(not7.reduce(less7)).toBeNull();
                        expectCriteria(not7.reduce(less8)).toEqual(Filter.equals(7));
                    }

                    {
                        // <=
                        let lessEquals3 = filter(Filter.lessEquals(3));
                        let lessEquals7 = filter(Filter.lessEquals(7));
                        let lessEquals8 = filter(Filter.lessEquals(8));

                        expect(not7.reduce(lessEquals3)).toBeNull();
                        expectCriteria(not7.reduce(lessEquals7)).toEqual(Filter.equals(7));
                        expectCriteria(not7.reduce(lessEquals8)).toEqual(Filter.equals(7));
                    }

                    {
                        // >
                        let greater8 = filter(Filter.greater(8));
                        let greater7 = filter(Filter.greater(7));
                        let greater6 = filter(Filter.greater(6));

                        expect(not7.reduce(greater8)).toBeNull();
                        expect(not7.reduce(greater7)).toBeNull();
                        expectCriteria(not7.reduce(greater6)).toEqual(Filter.equals(7));
                    }

                    {
                        // >=
                        let greaterEquals8 = filter(Filter.greaterEquals(8));
                        let greaterEquals7 = filter(Filter.greaterEquals(7));
                        let greaterEquals6 = filter(Filter.greaterEquals(6));

                        expect(not7.reduce(greaterEquals8)).toBeNull();
                        expectCriteria(not7.reduce(greaterEquals7)).toEqual(Filter.equals(7));
                        expectCriteria(not7.reduce(greaterEquals6)).toEqual(Filter.equals(7));
                    }
                });

                it("in / not-in", () => {
                    let in3and8 = filter(Filter.memberOf([3, 8]));
                    let in3and7 = filter(Filter.memberOf([3, 7]));

                    expect(not7.reduce(in3and8)).toBeNull();
                    expectCriteria(not7.reduce(in3and7)).toEqual(Filter.equals(7));

                    let notIn3and8 = filter(Filter.notMemberOf([3, 8]));
                    let notIn3and7 = filter(Filter.notMemberOf([3, 7]));

                    expectCriteria(not7.reduce(notIn3and8)).toEqual(Filter.equals(7));
                    expect(not7.reduce(notIn3and7)).toBeNull();
                });

                it("from-to", () => {
                    let from3to7 = filter(Filter.inRange(3, 7));
                    let from8to9 = filter(Filter.inRange(8, 9));

                    expectCriteria(not7.reduce(from3to7)).toEqual(Filter.equals(7));
                    expect(not7.reduce(from8to9)).toBeNull();
                });

                it("null due to null w/ point criterion", () => {
                    let notNull = filter(Filter.notNull("number"));

                    let lessThan3 = filter(Filter.less(3));
                    expect(notNull.reduce(lessThan3)).toBeNull();
                });
            });

            describe("string", () => {
                let notFoo = filter(Filter.notEquals("foo"));

                it("== / !=", () => {
                    let isBar = filter(Filter.equals("bar"));
                    let isFoo = filter(Filter.equals("foo"));

                    expect(notFoo.reduce(isBar)).toBeNull();
                    expect(notFoo.reduce(isFoo)).toBe(isFoo);

                    let notBar = filter(Filter.notEquals("bar"));
                    let alsoNotFoo = filter(Filter.notEquals("foo"));

                    expectCriteria(notFoo.reduce(notBar)).toEqual(Filter.equals("foo"));
                    expect(notFoo.reduce(alsoNotFoo)).toBeNull();
                });

                it("< / <= / > / >=", () => {
                    {
                        // <
                        let lessBar = filter(Filter.less("bar"));
                        let lessFoo = filter(Filter.less("foo"));
                        let lessKhaz = filter(Filter.less("khaz"));

                        expect(notFoo.reduce(lessBar)).toBeNull();
                        expect(notFoo.reduce(lessFoo)).toBeNull();
                        expectCriteria(notFoo.reduce(lessKhaz)).toEqual(Filter.equals("foo"));
                    }

                    {
                        // <=
                        let lessEqualsBar = filter(Filter.lessEquals("bar"));
                        let lessEqualsFoo = filter(Filter.lessEquals("foo"));
                        let lessEqualsKhaz = filter(Filter.lessEquals("khaz"));

                        expect(notFoo.reduce(lessEqualsBar)).toBeNull();
                        expectCriteria(notFoo.reduce(lessEqualsFoo)).toEqual(Filter.equals("foo"));
                        expectCriteria(notFoo.reduce(lessEqualsKhaz)).toEqual(Filter.equals("foo"));
                    }

                    {
                        // >
                        let greaterKhaz = filter(Filter.greater("khaz"));
                        let greaterFoo = filter(Filter.greater("foo"));
                        let greaterBar = filter(Filter.greater("bar"));

                        expect(notFoo.reduce(greaterKhaz)).toBeNull();
                        expect(notFoo.reduce(greaterFoo)).toBeNull();
                        expectCriteria(notFoo.reduce(greaterBar)).toEqual(Filter.equals("foo"));
                    }

                    {
                        // >=
                        let greaterEqualsKhaz = filter(Filter.greaterEquals("khaz"));
                        let greaterEqualsFoo = filter(Filter.greaterEquals("foo"));
                        let greaterEqualsBar = filter(Filter.greaterEquals("bar"));

                        expect(notFoo.reduce(greaterEqualsKhaz)).toBeNull();
                        expectCriteria(notFoo.reduce(greaterEqualsFoo)).toEqual(Filter.equals("foo"));
                        expectCriteria(notFoo.reduce(greaterEqualsBar)).toEqual(Filter.equals("foo"));
                    }
                });

                it("in / not-in", () => {
                    let inBarAndKhaz = filter(Filter.memberOf(["bar", "khaz"]));
                    let inBarAndFoo = filter(Filter.memberOf(["bar", "foo"]));

                    expect(notFoo.reduce(inBarAndKhaz)).toBeNull();
                    expectCriteria(notFoo.reduce(inBarAndFoo)).toEqual(Filter.equals("foo"));

                    let notInBarAndKhaz = filter(Filter.notMemberOf(["bar", "khaz"]));
                    let notInBarAndFoo = filter(Filter.notMemberOf(["bar", "foo"]));

                    expectCriteria(notFoo.reduce(notInBarAndKhaz)).toEqual(Filter.equals("foo"));
                    expect(notFoo.reduce(notInBarAndFoo)).toBeNull();
                });

                it("from-to", () => {
                    let fromBarToFoo = filter(Filter.inRange("bar", "foo"));
                    let fromKhazToMo = filter(Filter.inRange("khaz", "mo"));

                    expectCriteria(notFoo.reduce(fromBarToFoo)).toEqual(Filter.equals("foo"));
                    expect(notFoo.reduce(fromKhazToMo)).toBeNull();
                });

                it("null due to null w/ point criterion", () => {
                    let notNull = filter(Filter.notNull("string"));

                    let lessBar = filter(Filter.less("bar"));
                    expect(notNull.reduce(lessBar)).toBeNull();
                });
            });

            describe("date", () => {
                let not2017 = filter(Filter.notEquals(makeDate(2017)));

                it("== / !=", () => {
                    let is2016 = filter(Filter.equals(makeDate(2016)));
                    let is2017 = filter(Filter.equals(makeDate(2017)));

                    expect(not2017.reduce(is2016)).toBeNull();
                    expect(not2017.reduce(is2017)).toBe(is2017);

                    let not2016 = filter(Filter.notEquals(makeDate(2016)));
                    let alsoNot2017 = filter(Filter.notEquals(makeDate(2017)));

                    expectCriteria(not2017.reduce(not2016)).toEqual(Filter.equals(makeDate(2017)));
                    expect(not2017.reduce(alsoNot2017)).toBeNull();
                });

                it("< / <= / > / >=", () => {
                    {
                        // <
                        let less2016 = filter(Filter.less(makeDate(2016)));
                        let less2017 = filter(Filter.less(makeDate(2017)));
                        let less2018 = filter(Filter.less(makeDate(2018)));

                        expect(not2017.reduce(less2016)).toBeNull();
                        expect(not2017.reduce(less2017)).toBeNull();
                        expectCriteria(not2017.reduce(less2018)).toEqual(Filter.equals(makeDate(2017)));
                    }

                    {
                        // <=
                        let lessEquals2016 = filter(Filter.lessEquals(makeDate(2016)));
                        let lessEquals2017 = filter(Filter.lessEquals(makeDate(2017)));
                        let lessEquals2018 = filter(Filter.lessEquals(makeDate(2018)));

                        expect(not2017.reduce(lessEquals2016)).toBeNull();
                        expectCriteria(not2017.reduce(lessEquals2017)).toEqual(Filter.equals(makeDate(2017)));
                        expectCriteria(not2017.reduce(lessEquals2018)).toEqual(Filter.equals(makeDate(2017)));
                    }

                    {
                        // >
                        let greater2018 = filter(Filter.greater(makeDate(2018)));
                        let greater2017 = filter(Filter.greater(makeDate(2017)));
                        let greater2016 = filter(Filter.greater(makeDate(2016)));

                        expect(not2017.reduce(greater2018)).toBeNull();
                        expect(not2017.reduce(greater2017)).toBeNull();
                        expectCriteria(not2017.reduce(greater2016)).toEqual(Filter.equals(makeDate(2017)));
                    }

                    {
                        // >=
                        let greaterEquals2018 = filter(Filter.greaterEquals(makeDate(2018)));
                        let greaterEquals2017 = filter(Filter.greaterEquals(makeDate(2017)));
                        let greaterEquals2016 = filter(Filter.greaterEquals(makeDate(2016)));

                        expect(not2017.reduce(greaterEquals2018)).toBeNull();
                        expectCriteria(not2017.reduce(greaterEquals2017)).toEqual(Filter.equals(makeDate(2017)));
                        expectCriteria(not2017.reduce(greaterEquals2016)).toEqual(Filter.equals(makeDate(2017)));
                    }
                });

                it("from-to", () => {
                    let from2016to2017 = filter(Filter.inRange(makeDate(2016), makeDate(2017)));
                    let from2018to2019 = filter(Filter.inRange(makeDate(2018), makeDate(2019)));

                    expectCriteria(not2017.reduce(from2016to2017)).toEqual(Filter.equals(makeDate(2017)));
                    expect(not2017.reduce(from2018to2019)).toBeNull();
                });

                it("null due to null w/ point criterion", () => {
                    let notNull = filter(Filter.notNull("date"));

                    let lessThan3 = filter(Filter.less(makeDate(2017)));
                    expect(notNull.reduce(lessThan3)).toBeNull();
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
                    // todo: is not3 instead of not7 - this error will be in several places due to copy & paste
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

            describe("date", () => {
                let less2017 = filter(Filter.less(makeDate(2017)));

                it("== / !=", () => {
                    // ==
                    let equals2016 = filter(Filter.equals(makeDate(2016)));
                    let equals2018 = filter(Filter.equals(makeDate(2018)));

                    expect(less2017.reduce(equals2016)).toBeNull();
                    expect(less2017.reduce(equals2018)).toBe(equals2018);

                    // !=
                    let not2016 = filter(Filter.notEquals(makeDate(2016)));
                    let not2017 = filter(Filter.notEquals(makeDate(2017)));
                    let not2018 = filter(Filter.notEquals(makeDate(2018)));

                    // todo: inconsistent behaviour between "!=" and "not-in"
                    expectCriteria(less2017.reduce(not2016)).toEqual(Filter.greaterEquals(makeDate(2017)));
                    expectCriteria(less2017.reduce(not2017)).toEqual(Filter.greaterEquals(makeDate(2017)));
                    expectCriteria(less2017.reduce(not2018)).toEqual(Filter.greaterEquals(makeDate(2017)));
                });

                it("< / <=", () => {
                    // <
                    let less2016 = filter(Filter.less(makeDate(2016)));
                    let alsoLess2017 = filter(Filter.less(makeDate(2017)));
                    let less2018 = filter(Filter.less(makeDate(2018)));

                    expect(less2017.reduce(less2016)).toBeNull();
                    expect(less2017.reduce(alsoLess2017)).toBeNull();
                    expectCriteria(less2017.reduce(less2018)).toEqual(Filter.inRange(makeDate(2017), makeDate(2018, -1)));

                    // <=
                    let lessEquals2016 = filter(Filter.lessEquals(makeDate(2016)));
                    let lessEquals2017 = filter(Filter.lessEquals(makeDate(2017)));
                    let lessEquals2018 = filter(Filter.lessEquals(makeDate(2018)));

                    expect(less2017.reduce(lessEquals2016)).toBeNull();
                    expectCriteria(less2017.reduce(lessEquals2017)).toEqual(Filter.equals(makeDate(2017)));
                    expectCriteria(less2017.reduce(lessEquals2018)).toEqual(Filter.inRange(makeDate(2017), makeDate(2018)));
                });

                it("> / >=", () => {
                    // >
                    let greater2016 = filter(Filter.greater(makeDate(2016)));
                    let greaterLastOf2016 = filter(Filter.greater(makeDate(2017, -1)));

                    expectCriteria(less2017.reduce(greater2016)).toEqual(Filter.greaterEquals(makeDate(2017)));
                    expect(less2017.reduce(greaterLastOf2016)).toBe(greaterLastOf2016);

                    // >=
                    let greaterEquals2016 = filter(Filter.greaterEquals(makeDate(2016)));
                    let greaterEquals2017 = filter(Filter.greaterEquals(makeDate(2017)));

                    expectCriteria(less2017.reduce(greaterEquals2016)).toEqual(Filter.greaterEquals(makeDate(2017)));
                    expect(less2017.reduce(greaterEquals2017)).toBe(greaterEquals2017);
                });

                it("from / to", () => {
                    let from2015to2016 = filter(Filter.inRange(makeDate(2015), makeDate(2016)));
                    let from2015to2017 = filter(Filter.inRange(makeDate(2015), makeDate(2017)));
                    let from2015to2018 = filter(Filter.inRange(makeDate(2015), makeDate(2018)));
                    let from2017to2018 = filter(Filter.inRange(makeDate(2017), makeDate(2018)));

                    expect(less2017.reduce(from2015to2016)).toBeNull();
                    expectCriteria(less2017.reduce(from2015to2017)).toEqual(Filter.equals(makeDate(2017)));
                    expectCriteria(less2017.reduce(from2015to2018)).toEqual(Filter.inRange(makeDate(2017), makeDate(2018)));
                    expect(less2017.reduce(from2017to2018)).toBe(from2017to2018);
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
                    let not7 = filter(Filter.notEquals(7));
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

            describe("date", () => {
                let lessEquals2017 = filter(Filter.lessEquals(makeDate(2017)));

                it("== / !=", () => {
                    // ==
                    let equals2016 = filter(Filter.equals(makeDate(2016)));
                    let equals2017 = filter(Filter.equals(makeDate(2017)));
                    let equals2018 = filter(Filter.equals(makeDate(2018)));

                    expect(lessEquals2017.reduce(equals2016)).toBeNull();
                    expect(lessEquals2017.reduce(equals2017)).toBeNull();
                    expect(lessEquals2017.reduce(equals2018)).toBe(equals2018);

                    // !=
                    let not3 = filter(Filter.notEquals(makeDate(2016)));
                    let not7 = filter(Filter.notEquals(makeDate(2017)));
                    let not8 = filter(Filter.notEquals(makeDate(2018)));

                    // todo: inconsistent behaviour between "!=" and "not-in"
                    expectCriteria(lessEquals2017.reduce(not3)).toEqual(Filter.greater(makeDate(2017)));
                    expectCriteria(lessEquals2017.reduce(not7)).toEqual(Filter.greater(makeDate(2017)));
                    expectCriteria(lessEquals2017.reduce(not8)).toEqual(Filter.greater(makeDate(2017)));
                });

                it("< / <=", () => {
                    // <
                    let less2016 = filter(Filter.less(makeDate(2016)));
                    let less2017 = filter(Filter.less(makeDate(2017)));
                    let lessSecondOf2017 = filter(Filter.less(makeDate(2017, 1)));
                    let less2018 = filter(Filter.less(makeDate(2018)));

                    expect(lessEquals2017.reduce(less2016)).toBeNull();
                    expect(lessEquals2017.reduce(less2017)).toBeNull();
                    expect(lessEquals2017.reduce(lessSecondOf2017)).toBeNull();
                    expectCriteria(lessEquals2017.reduce(less2018)).toEqual(Filter.inRange(makeDate(2017, 1), makeDate(2018, -1)));

                    // <=
                    let lessEquals2016 = filter(Filter.lessEquals(makeDate(2016)));
                    let alsoLessEquals2017 = filter(Filter.lessEquals(makeDate(2017)));
                    let lessEquals2018 = filter(Filter.lessEquals(makeDate(2018)));

                    expect(lessEquals2017.reduce(lessEquals2016)).toBeNull();
                    expect(lessEquals2017.reduce(alsoLessEquals2017)).toBeNull();
                    expectCriteria(lessEquals2017.reduce(lessEquals2018)).toEqual(Filter.inRange(makeDate(2017, 1), makeDate(2018)));
                });

                it("> / >=", () => {
                    // >
                    let greater2016 = filter(Filter.greater(makeDate(2016)));
                    let greater2017 = filter(Filter.greater(makeDate(2017)));

                    expectCriteria(lessEquals2017.reduce(greater2016)).toEqual(Filter.greater(makeDate(2017)));
                    expect(lessEquals2017.reduce(greater2017)).toBe(greater2017);

                    // >=
                    let greaterEquals2017 = filter(Filter.greaterEquals(makeDate(2017)));
                    let greaterEquals2018 = filter(Filter.greaterEquals(makeDate(2018)));

                    expectCriteria(lessEquals2017.reduce(greaterEquals2017)).toEqual(Filter.greater(makeDate(2017)));
                    expect(lessEquals2017.reduce(greaterEquals2018)).toBe(greaterEquals2018);
                });

                it("from / to", () => {
                    let from2016to2017 = filter(Filter.inRange(makeDate(2016), makeDate(2017)));
                    let from2016toSecondOf2017 = filter(Filter.inRange(makeDate(2016), makeDate(2017, 1)));
                    let from2016to2018 = filter(Filter.inRange(makeDate(2016), makeDate(2018)));
                    let from2018to2019 = filter(Filter.inRange(makeDate(2018), makeDate(2019)));

                    expect(lessEquals2017.reduce(from2016to2017)).toBeNull();
                    expectCriteria(lessEquals2017.reduce(from2016toSecondOf2017)).toEqual(Filter.equals(makeDate(2017, 1)));
                    expectCriteria(lessEquals2017.reduce(from2016to2018)).toEqual(Filter.inRange(makeDate(2017, 1), makeDate(2018)));
                    expect(lessEquals2017.reduce(from2018to2019)).toBe(from2018to2019);
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
                    let less9 = filter(Filter.less(9));
                    let less8 = filter(Filter.less(8));
                    let less6 = filter(Filter.less(6));

                    expectCriteria(greater7.reduce(less9)).toEqual(Filter.lessEquals(7));
                    expect(greater7.reduce(less8)).toBe(less8);
                    expect(greater7.reduce(less6)).toBe(less6);

                    // <=
                    let lessEquals9 = filter(Filter.lessEquals(9));
                    let lessEquals7 = filter(Filter.lessEquals(7));
                    let lessEquals6 = filter(Filter.lessEquals(6));

                    expectCriteria(greater7.reduce(lessEquals9)).toEqual(Filter.lessEquals(7));
                    expect(greater7.reduce(lessEquals7)).toBe(lessEquals7);
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

            describe("date", () => {
                let greater2017 = filter(Filter.greater(makeDate(2017)));

                it("== / !=", () => {
                    // ==
                    let equals2018 = filter(Filter.equals(makeDate(2018)));
                    let equals2017 = filter(Filter.equals(makeDate(2017)));

                    expect(greater2017.reduce(equals2018)).toBeNull();
                    expect(greater2017.reduce(equals2017)).toBe(equals2017);

                    // !=
                    let not2016 = filter(Filter.notEquals(makeDate(2016)));
                    let not2017 = filter(Filter.notEquals(makeDate(2017)));
                    let not2018 = filter(Filter.notEquals(makeDate(2018)));

                    // todo: inconsistent behaviour between "!=" and "not-in"
                    expectCriteria(greater2017.reduce(not2016)).toEqual(Filter.lessEquals(makeDate(2017)));
                    expectCriteria(greater2017.reduce(not2017)).toEqual(Filter.lessEquals(makeDate(2017)));
                    expectCriteria(greater2017.reduce(not2018)).toEqual(Filter.lessEquals(makeDate(2017)));
                });

                it("< / <=", () => {
                    // <
                    let less2018 = filter(Filter.less(makeDate(2018)));
                    let lessSecondOf2017 = filter(Filter.less(makeDate(2017, 1)));
                    let less2017 = filter(Filter.less(makeDate(2017)));

                    expectCriteria(greater2017.reduce(less2018)).toEqual(Filter.lessEquals(makeDate(2017)));
                    expect(greater2017.reduce(lessSecondOf2017)).toBe(lessSecondOf2017);
                    expect(greater2017.reduce(less2017)).toBe(less2017);

                    // <=
                    let lessEquals2018 = filter(Filter.lessEquals(makeDate(2018)));
                    let lessEquals2017 = filter(Filter.lessEquals(makeDate(2017)));

                    expectCriteria(greater2017.reduce(lessEquals2018)).toEqual(Filter.lessEquals(makeDate(2017)));
                    expect(greater2017.reduce(lessEquals2017)).toBe(lessEquals2017);
                });

                it("> / >=", () => {
                    // >
                    let greater2018 = filter(Filter.greater(makeDate(2018)));
                    let greater2017 = filter(Filter.greater(makeDate(2017)));
                    let greater2016 = filter(Filter.greater(makeDate(2016)));

                    expect(greater2017.reduce(greater2018)).toBeNull();
                    expect(greater2017.reduce(greater2017)).toBeNull();
                    expectCriteria(greater2017.reduce(greater2016)).toEqual(Filter.inRange(makeDate(2016, 1), makeDate(2017)));

                    // >=
                    let greaterEquals2018 = filter(Filter.greaterEquals(makeDate(2018)));
                    let greaterEquals2017 = filter(Filter.greaterEquals(makeDate(2017)));
                    let greaterEquals2016 = filter(Filter.greaterEquals(makeDate(2016)));

                    expect(greater2017.reduce(greaterEquals2018)).toBeNull();
                    expectCriteria(greater2017.reduce(greaterEquals2017)).toEqual(Filter.equals(makeDate(2017)));
                    expectCriteria(greater2017.reduce(greaterEquals2016)).toEqual(Filter.inRange(makeDate(2016), makeDate(2017)));
                });

                it("from / to", () => {
                    let from2018to2019 = filter(Filter.inRange(makeDate(2018), makeDate(2019)));
                    let from2017to2018 = filter(Filter.inRange(makeDate(2017), makeDate(2018)));
                    let from2016to2018 = filter(Filter.inRange(makeDate(2016), makeDate(2018)));
                    let from2016to2017 = filter(Filter.inRange(makeDate(2016), makeDate(2017)));

                    expect(greater2017.reduce(from2018to2019)).toBeNull();
                    expectCriteria(greater2017.reduce(from2017to2018)).toEqual(Filter.equals(makeDate(2017)));
                    expectCriteria(greater2017.reduce(from2016to2018)).toEqual(Filter.inRange(makeDate(2016), makeDate(2017)));
                    expect(greater2017.reduce(from2016to2017)).toBe(from2016to2017);
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

            describe("string", () => {
                let greaterEqualsFoo = filter(Filter.greaterEquals("foo"));

                it("== / !=", () => {
                    // ==
                    let equalsKhaz = filter(Filter.equals("khaz"));
                    let equalsFoo = filter(Filter.equals("foo"));
                    let equalsBar = filter(Filter.equals("bar"));

                    expect(greaterEqualsFoo.reduce(equalsKhaz)).toBeNull();
                    expect(greaterEqualsFoo.reduce(equalsFoo)).toBeNull();
                    expect(greaterEqualsFoo.reduce(equalsBar)).toBe(equalsBar);

                    // !=
                    let notBar = filter(Filter.notEquals("bar"));
                    let notFoo = filter(Filter.notEquals("foo"));
                    let notBaz = filter(Filter.notEquals("baz"));

                    // todo: inconsistent behaviour between "!=" and "not-in"
                    expectCriteria(greaterEqualsFoo.reduce(notBar)).toEqual(Filter.less("foo"));
                    expectCriteria(greaterEqualsFoo.reduce(notFoo)).toEqual(Filter.less("foo"));
                    expectCriteria(greaterEqualsFoo.reduce(notBaz)).toEqual(Filter.less("foo"));
                });

                it("< / <=", () => {
                    // <
                    let lessKhaz = filter(Filter.less("khaz"));
                    let lessFoo = filter(Filter.less("foo"));

                    expectCriteria(greaterEqualsFoo.reduce(lessKhaz)).toEqual(Filter.less("foo"));
                    expect(greaterEqualsFoo.reduce(lessFoo)).toBe(lessFoo);

                    // <=
                    let lessEqualsKhaz = filter(Filter.lessEquals("khaz"));
                    let lessEqualsFoo = filter(Filter.lessEquals("foo"));
                    let lessEqualsBar = filter(Filter.lessEquals("bar"));

                    expectCriteria(greaterEqualsFoo.reduce(lessEqualsKhaz)).toEqual(Filter.less("foo"));
                    expectCriteria(greaterEqualsFoo.reduce(lessEqualsFoo)).toEqual(Filter.less("foo"));
                    expect(greaterEqualsFoo.reduce(lessEqualsBar)).toBe(lessEqualsBar);
                });

                it("> / >=", () => {
                    // >
                    let greaterKhaz = filter(Filter.greater("khaz"));
                    let greaterFoo = filter(Filter.greater("foo"));
                    let greaterBar = filter(Filter.greater("bar"));

                    expect(greaterEqualsFoo.reduce(greaterKhaz)).toBeNull();
                    expect(greaterEqualsFoo.reduce(greaterFoo)).toBeNull();
                    expectCriteria(greaterEqualsFoo.reduce(greaterBar)).toEqual(Filter.inRange("bar", "foo"));

                    // >=
                    let greaterEqualsKhaz = filter(Filter.greaterEquals("khaz"));
                    let alsoGreaterEqualsFoo = filter(Filter.greaterEquals("foo"));
                    let greaterEqualsBar = filter(Filter.greaterEquals("bar"));

                    expect(greaterEqualsFoo.reduce(greaterEqualsKhaz)).toBeNull();
                    expect(greaterEqualsFoo.reduce(alsoGreaterEqualsFoo)).toBeNull();
                    expectCriteria(greaterEqualsFoo.reduce(greaterEqualsBar)).toEqual(Filter.inRange("bar", "foo"));
                });

                it("from / to", () => {
                    let fromKhazToMo = filter(Filter.inRange("khaz", "mo"));
                    let fromFooToKhaz = filter(Filter.inRange("foo", "khaz"));
                    let fromBarToKhaz = filter(Filter.inRange("bar", "khaz"));
                    let fromBarToFoo = filter(Filter.inRange("bar", "foo"));

                    expect(greaterEqualsFoo.reduce(fromKhazToMo)).toBeNull();
                    expect(greaterEqualsFoo.reduce(fromFooToKhaz)).toBeNull();
                    expectCriteria(greaterEqualsFoo.reduce(fromBarToKhaz)).toEqual(Filter.inRange("bar", "foo"));
                    expect(greaterEqualsFoo.reduce(fromBarToFoo)).toBe(fromBarToFoo);
                });

                it("in / not-in", () => {
                    // in
                    let completely = filter(Filter.memberOf(["foo", "khaz"]));
                    let transformed = filter(Filter.memberOf(["foo", "khaz", "bar"]));
                    let partially = filter(Filter.memberOf(["foo", "khaz", "bar", "baz"]));
                    let untouched = filter(Filter.memberOf(["bar", "baz"]));

                    expect(greaterEqualsFoo.reduce(completely)).toBeNull();
                    expectCriteria(greaterEqualsFoo.reduce(transformed)).toEqual(Filter.equals("bar"));
                    expectCriteria(greaterEqualsFoo.reduce(partially)).toEqual(Filter.memberOf(["bar", "baz"]));
                    expect(greaterEqualsFoo.reduce(untouched)).toBe(untouched);

                    // not-in
                    let alwaysUntouched = filter(Filter.notMemberOf(["foo", "bar"]));

                    expect(greaterEqualsFoo.reduce(alwaysUntouched)).toBe(alwaysUntouched);
                });
            });

            describe("date", () => {
                let greaterEquals2017 = filter(Filter.greaterEquals(makeDate(2017)));

                it("== / !=", () => {
                    // ==
                    let equals2017 = filter(Filter.equals(makeDate(2017)));
                    let equals2016 = filter(Filter.equals(makeDate(2016)));

                    expect(greaterEquals2017.reduce(equals2017)).toBeNull();
                    expect(greaterEquals2017.reduce(equals2016)).toBe(equals2016);

                    // !=
                    let not2016 = filter(Filter.notEquals(makeDate(2016)));
                    let not2017 = filter(Filter.notEquals(makeDate(2017)));
                    let not2018 = filter(Filter.notEquals(makeDate(2018)));

                    // todo: inconsistent behaviour between "!=" and "not-in"
                    expectCriteria(greaterEquals2017.reduce(not2016)).toEqual(Filter.less(makeDate(2017)));
                    expectCriteria(greaterEquals2017.reduce(not2017)).toEqual(Filter.less(makeDate(2017)));
                    expectCriteria(greaterEquals2017.reduce(not2018)).toEqual(Filter.less(makeDate(2017)));
                });

                it("< / <=", () => {
                    // <
                    let less2018 = filter(Filter.less(makeDate(2018)));
                    let less2017 = filter(Filter.less(makeDate(2017)));

                    expectCriteria(greaterEquals2017.reduce(less2018)).toEqual(Filter.less(makeDate(2017)));
                    expect(greaterEquals2017.reduce(less2017)).toBe(less2017);

                    // <=
                    let lessEquals2017 = filter(Filter.lessEquals(makeDate(2017)));
                    let lessEquals2016 = filter(Filter.lessEquals(makeDate(2016)));

                    expectCriteria(greaterEquals2017.reduce(lessEquals2017)).toEqual(Filter.less(makeDate(2017)));
                    expect(greaterEquals2017.reduce(lessEquals2016)).toBe(lessEquals2016);
                });

                it("> / >=", () => {
                    // >
                    let greaterLastOf2016 = filter(Filter.greater(makeDate(2017, -1)));
                    let greater2016 = filter(Filter.greater(makeDate(2016)));

                    expect(greaterEquals2017.reduce(greaterLastOf2016)).toBeNull();
                    expectCriteria(greaterEquals2017.reduce(greater2016)).toEqual(Filter.inRange(makeDate(2016, 1), makeDate(2017, -1)));

                    // // >=
                    let greaterEquals2018 = filter(Filter.greaterEquals(makeDate(2018)));
                    let greaterEquals2016 = filter(Filter.greaterEquals(makeDate(2016)));

                    expect(greaterEquals2017.reduce(greaterEquals2018)).toBeNull();
                    expectCriteria(greaterEquals2017.reduce(greaterEquals2016)).toEqual(Filter.inRange(makeDate(2016), makeDate(2017, -1)));
                });

                it("from / to", () => {
                    let from2017to2018 = filter(Filter.inRange(makeDate(2017), makeDate(2018)));
                    let fromLastOf2016to2018 = filter(Filter.inRange(makeDate(2017, -1), makeDate(2018)));
                    let from2016to2018 = filter(Filter.inRange(makeDate(2016), makeDate(2018)));
                    let from2015to2016 = filter(Filter.inRange(makeDate(2015), makeDate(2016)));

                    expect(greaterEquals2017.reduce(from2017to2018)).toBeNull();
                    expectCriteria(greaterEquals2017.reduce(fromLastOf2016to2018)).toEqual(Filter.equals(makeDate(2017, -1)));
                    expectCriteria(greaterEquals2017.reduce(from2016to2018)).toEqual(Filter.inRange(makeDate(2016), makeDate(2017, -1)));
                    expect(greaterEquals2017.reduce(from2015to2016)).toBe(from2015to2016);
                });
            });
        });

        describe("in", () => {
            describe("bool", () => {
                let inTrueFalse = filter(Filter.memberOf([true, false]));
                let inTrue = filter(Filter.memberOf([true]));

                it("==", () => {
                    let isTrue = filter(Filter.equals(true));
                    let isNull = filter(Filter.isNull("bool"));
                    let isFalse = filter(Filter.equals(false));

                    expect(inTrueFalse.reduce(isTrue)).toBeNull();
                    expect(inTrueFalse.reduce(isFalse)).toBeNull();
                    expect(inTrueFalse.reduce(isNull)).toBe(isNull);
                });

                it("in / not-in", () => {
                    let inTrueNull = filter(Filter.memberOf([true, null]));
                    let alsoInTrueFalse = filter(Filter.memberOf([true, false]));
                    let inFalseNull = filter(Filter.memberOf([false, null]));
                    let inTrueFalseNull = filter(Filter.memberOf([true, false, null]));
                    // todo: solve this
                    // let inNull = filter(Filter.memberOf([null]));

                    expectCriteria(inTrueFalse.reduce(inTrueNull)).toEqual(Filter.isNull("bool"));
                    expect(inTrueFalse.reduce(alsoInTrueFalse)).toBeNull();
                    expect(inTrue.reduce(inFalseNull)).toBe(inFalseNull);
                    expectCriteria(inTrue.reduce(inTrueFalseNull)).toEqual(Filter.memberOf([false, null]));
                    // expect(inTrueAndFalse.reduce(inNull)).toBe(Filter.isNull("bool"));

                    let notInFalseNull = filter(Filter.notMemberOf([false, null]));
                    let notInFalse = filter(Filter.notMemberOf([false]));
                    let notInTrue = filter(Filter.notMemberOf([true]));

                    expect(inTrue.reduce(notInFalseNull)).toBeNull();
                    expectCriteria(inTrue.reduce(notInFalse)).toEqual(Filter.isNull("bool"));
                    expect(inTrue.reduce(notInTrue)).toBe(notInTrue);
                });
            });

            describe("number", () => {
                let in3and7 = filter(Filter.memberOf([3, 7]));

                it("==", () => {
                    let is3 = filter(Filter.equals(3));
                    let is7 = filter(Filter.equals(7));
                    let is8 = filter(Filter.equals(8));

                    expect(in3and7.reduce(is3)).toBeNull();
                    expect(in3and7.reduce(is7)).toBeNull();
                    expect(in3and7.reduce(is8)).toBe(is8);
                });

                it("in / not-in", () => {
                    {
                        // in
                        let completely = filter(Filter.memberOf([3, 7]));
                        let transformed = filter(Filter.memberOf([3, 7, 8]));
                        let partially = filter(Filter.memberOf([3, 7, 8, 64]));
                        let untouched = filter(Filter.memberOf([8, 64]));

                        expect(in3and7.reduce(completely)).toBeNull();
                        expectCriteria(in3and7.reduce(transformed)).toEqual(Filter.equals(8));
                        expectCriteria(in3and7.reduce(partially)).toEqual(Filter.memberOf([8, 64]));
                        expect(in3and7.reduce(untouched)).toBe(untouched);
                    }

                    {
                        // not-in
                        let untouched = filter(Filter.notMemberOf([3, 7]));
                        let reduced = filter(Filter.notMemberOf([1, 2, 3]));

                        expect(in3and7.reduce(untouched)).toBe(untouched);
                        expectCriteria(in3and7.reduce(reduced)).toEqual(Filter.notMemberOf([1, 2, 3, 7]));
                    }
                });
            });

            describe("string", () => {
                let inFooAndBar = filter(Filter.memberOf(["foo", "bar"]));

                it("==", () => {
                    let isBar = filter(Filter.equals("bar"));
                    let isFoo = filter(Filter.equals("foo"));
                    let isKhaz = filter(Filter.equals("khaz"));

                    expect(inFooAndBar.reduce(isBar)).toBeNull();
                    expect(inFooAndBar.reduce(isFoo)).toBeNull();
                    expect(inFooAndBar.reduce(isKhaz)).toBe(isKhaz);
                });

                it("in / not-in", () => {
                    {
                        // in
                        let completely = filter(Filter.memberOf(["bar", "foo"]));
                        let transformed = filter(Filter.memberOf(["foo", "bar", "khaz"]));
                        let partially = filter(Filter.memberOf(["foo", "bar", "khaz", "mo"]));
                        let untouched = filter(Filter.memberOf(["khaz", "mo"]));

                        expect(inFooAndBar.reduce(completely)).toBeNull();
                        expectCriteria(inFooAndBar.reduce(transformed)).toEqual(Filter.equals("khaz"));
                        expectCriteria(inFooAndBar.reduce(partially)).toEqual(Filter.memberOf(["khaz", "mo"]));
                        expect(inFooAndBar.reduce(untouched)).toBe(untouched);
                    }

                    {
                        // not-in
                        let untouched = filter(Filter.notMemberOf(["bar", "foo"]));
                        let reduced = filter(Filter.notMemberOf(["bar", "baz"]));

                        expect(inFooAndBar.reduce(untouched)).toBe(untouched);
                        expectCriteria(inFooAndBar.reduce(reduced)).toEqual(Filter.notMemberOf(["foo", "bar", "baz"]));
                    }
                });
            });
        });

        describe("not-in", () => {
            describe("bool", () => {
                let notInTrue = filter(Filter.notMemberOf([true]));
                let notInTrueFalse = filter(Filter.notMemberOf([true, false]));

                it("== / !=", () => {
                    let isFalse = filter(Filter.equals(false));
                    let isTrue = filter(Filter.equals(true));

                    expect(notInTrue.reduce(isFalse)).toBeNull();
                    expect(notInTrue.reduce(isTrue)).toBe(isTrue);

                    let notFalse = filter(Filter.notEquals(false));
                    let notTrue = filter(Filter.notEquals(true));
                    let notNull = filter(Filter.notNull("bool"));

                    expectCriteria(notInTrue.reduce(notFalse)).toEqual(Filter.equals(true));
                    expect(notInTrue.reduce(notTrue)).toBeNull();
                    expectCriteria(notInTrueFalse.reduce(notNull)).toEqual(Filter.memberOf([true, false]));
                });
            });

            describe("number", () => {
                let notIn3and7 = filter(Filter.notMemberOf([3, 7]));
                let notIn7 = filter(Filter.notMemberOf([7]));
                let notIn3and7and8 = filter(Filter.notMemberOf([3, 7, 8]));

                it("== / !=", () => {
                    let is7 = filter(Filter.equals(7));
                    let is8 = filter(Filter.equals(8));

                    expect(notIn3and7.reduce(is7)).toBe(is7);
                    expect(notIn3and7.reduce(is8)).toBeNull();

                    let not7 = filter(Filter.notEquals(7));
                    let not8 = filter(Filter.notEquals(8));

                    expectCriteria(notIn3and7.reduce(not7)).toEqual(Filter.equals(3));
                    expectCriteria(notIn3and7.reduce(not8)).toEqual(Filter.memberOf([3, 7]));
                    expect(notIn7.reduce(not7)).toBeNull();
                });

                it("in / not-in", () => {
                    let in4and6 = filter(Filter.memberOf([4, 6]));
                    let in3and6 = filter(Filter.memberOf([3, 6]));
                    let in3 = filter(Filter.memberOf([3]));
                    let in3and7and8 = filter(Filter.memberOf([3, 7, 8]));

                    expect(notIn3and7.reduce(in4and6)).toBeNull();
                    expectCriteria(notIn3and7.reduce(in3and6)).toEqual(Filter.equals(3));
                    expect(notIn3and7.reduce(in3)).toBe(in3);
                    expectCriteria(notIn3and7.reduce(in3and7and8)).toEqual(Filter.memberOf([3, 7]));

                    let notIn3and8 = filter(Filter.notMemberOf([3, 8]));
                    let notIn3and6 = filter(Filter.notMemberOf([3, 6]));
                    let notIn3 = filter(Filter.notMemberOf([3]));

                    expectCriteria(notIn3and7.reduce(notIn3and8)).toEqual(Filter.equals(7));
                    expectCriteria(notIn3and7and8.reduce(notIn3and6)).toEqual(Filter.memberOf([7, 8]));
                    expect(notIn3.reduce(notIn3and8)).toBeNull();
                });
            });

            describe("string", () => {
                let notInFooAndBar = filter(Filter.notMemberOf(["foo", "bar"]));
                let notInFooAndBarAndKhaz = filter(Filter.notMemberOf(["foo", "bar", "khaz"]));
                let notInFoo = filter(Filter.notMemberOf(["foo"]));

                it("== / !=", () => {
                    let isFoo = filter(Filter.equals("foo"));
                    let isKhaz = filter(Filter.equals("khaz"));

                    expect(notInFooAndBar.reduce(isFoo)).toBe(isFoo);
                    expect(notInFooAndBar.reduce(isKhaz)).toBeNull();

                    let notFoo = filter(Filter.notEquals("foo"));
                    let notKhaz = filter(Filter.notEquals("khaz"));

                    expectCriteria(notInFooAndBar.reduce(notFoo)).toEqual(Filter.equals("bar"));
                    expectCriteria(notInFooAndBar.reduce(notKhaz)).toEqual(Filter.memberOf(["foo", "bar"]));
                    expect(notInFoo.reduce(notFoo)).toBeNull();
                });

                it("in / not-in", () => {
                    let inKhazAndMo = filter(Filter.memberOf(["khaz", "mo"]));
                    let inFooAndMo = filter(Filter.memberOf(["foo", "mo"]));
                    let inFoo = filter(Filter.memberOf(["foo"]));
                    let inFooAndBarAndKhaz = filter(Filter.memberOf(["foo", "bar", "khaz"]))

                    expect(notInFooAndBar.reduce(inKhazAndMo)).toBeNull();
                    expectCriteria(notInFooAndBar.reduce(inFooAndMo)).toEqual(Filter.equals("foo"));
                    expect(notInFooAndBar.reduce(inFoo)).toBe(inFoo);
                    expectCriteria(notInFooAndBar.reduce(inFooAndBarAndKhaz)).toEqual(Filter.memberOf(["foo", "bar"]));

                    let notInFooAndKhaz = filter(Filter.notMemberOf(["foo", "khaz"]));
                    let notInFoo = filter(Filter.notMemberOf(["foo"]));

                    expectCriteria(notInFooAndBar.reduce(notInFooAndKhaz)).toEqual(Filter.equals("bar"));
                    expectCriteria(notInFooAndBarAndKhaz.reduce(notInFoo)).toEqual(Filter.memberOf(["bar", "khaz"]));
                    expect(notInFoo.reduce(notInFooAndKhaz)).toBeNull();
                });
            });
        });

        describe("from-to", () => {
            describe("number", () => {
                let from3to7 = filter(Filter.inRange(3, 7));

                it("==", () => {
                    let equals3 = filter(Filter.equals(3));
                    let equals8 = filter(Filter.equals(8));

                    expect(from3to7.reduce(equals3)).toBeNull();
                    expect(from3to7.reduce(equals8)).toBe(equals8);
                });

                it("< / <= / > / >=", () => {
                    {
                        // <
                        let less4 = filter(Filter.less(4));
                        let less2 = filter(Filter.less(2));

                        expectCriteria(from3to7.reduce(less4)).toEqual(Filter.less(3));
                        expect(from3to7.reduce(less2)).toBe(less2);
                    }

                    {
                        // <=
                        let lessEquals3 = filter(Filter.lessEquals(3));
                        let lessEquals2 = filter(Filter.lessEquals(2));

                        expectCriteria(from3to7.reduce(lessEquals3)).toEqual(Filter.less(3));
                        expect(from3to7.reduce(lessEquals2)).toBe(lessEquals2);
                    }

                    {
                        // >
                        let greater6 = filter(Filter.greater(6));
                        let greater7 = filter(Filter.greater(7));

                        expectCriteria(from3to7.reduce(greater6)).toEqual(Filter.greater(7));
                        expect(from3to7.reduce(greater7)).toBe(greater7);
                    }

                    {
                        // >=
                        let greaterEquals7 = filter(Filter.greaterEquals(7));
                        let greaterEquals8 = filter(Filter.greaterEquals(8));

                        expectCriteria(from3to7.reduce(greaterEquals7)).toEqual(Filter.greater(7));
                        expect(from3to7.reduce(greaterEquals8)).toBe(greaterEquals8);
                    }
                });

                it("in", () => {
                    // in
                    let completely = filter(Filter.memberOf([3, 7]));
                    let transformed = filter(Filter.memberOf([3, 7, 8]));
                    let partially = filter(Filter.memberOf([3, 7, 8, 64]));
                    let untouched = filter(Filter.memberOf([8, 64]));

                    expect(from3to7.reduce(completely)).toBeNull();
                    expectCriteria(from3to7.reduce(transformed)).toEqual(Filter.equals(8));
                    expectCriteria(from3to7.reduce(partially)).toEqual(Filter.memberOf([8, 64]));
                    expect(from3to7.reduce(untouched)).toBe(untouched);

                    // not-in
                    let alwaysUntouched = filter(Filter.notMemberOf([3, 7]));

                    expect(from3to7.reduce(alwaysUntouched)).toBe(alwaysUntouched);
                });

                it("from-to", () => {
                    let from1to6 = filter(Filter.inRange(1, 6));
                    let from5to9 = filter(Filter.inRange(5, 9));
                    let from4to6 = filter(Filter.inRange(4, 6));
                    let from1to9 = filter(Filter.inRange(1, 9));
                    let from9to16 = filter(Filter.inRange(9, 16));

                    expectCriteria(from3to7.reduce(from1to6)).toEqual(Filter.inRange(1, 2));
                    expectCriteria(from3to7.reduce(from5to9)).toEqual(Filter.inRange(8, 9));
                    expect(from3to7.reduce(from4to6)).toBeNull();
                    expect(from3to7.reduce(from1to9)).toBe(from1to9);
                    expect(from3to7.reduce(from9to16)).toBe(from9to16);
                });
            });

            describe("string", () => {
                let fromBarToFoo = filter(Filter.inRange("bar", "foo"));

                it("==", () => {
                    let equalsBar = filter(Filter.equals("bar"));
                    let equalsKhaz = filter(Filter.equals("khaz"));

                    expect(fromBarToFoo.reduce(equalsBar)).toBeNull();
                    expect(fromBarToFoo.reduce(equalsKhaz)).toBe(equalsKhaz);
                });

                it("< / <= / > / >=", () => {
                    {
                        // <
                        let lessBaz = filter(Filter.less("baz"));
                        let lessBar = filter(Filter.less("bar"));

                        expectCriteria(fromBarToFoo.reduce(lessBaz)).toEqual(Filter.less("bar"));
                        expect(fromBarToFoo.reduce(lessBar)).toBe(lessBar);
                    }

                    {
                        // <=
                        let lessEqualsBar = filter(Filter.lessEquals("bar"));
                        let lessEqualsA = filter(Filter.lessEquals("a"));

                        expectCriteria(fromBarToFoo.reduce(lessEqualsBar)).toEqual(Filter.less("bar"));
                        expect(fromBarToFoo.reduce(lessEqualsA)).toBe(lessEqualsA);
                    }

                    {
                        // >
                        let greaterDan = filter(Filter.greater("dan"));
                        let greaterFoo = filter(Filter.greater("foo"));

                        expectCriteria(fromBarToFoo.reduce(greaterDan)).toEqual(Filter.greater("foo"));
                        expect(fromBarToFoo.reduce(greaterFoo)).toBe(greaterFoo);
                    }

                    {
                        // >=
                        let greaterEqualsFoo = filter(Filter.greaterEquals("foo"));
                        let greaterEqualsKhaz = filter(Filter.greaterEquals("khaz"));

                        expectCriteria(fromBarToFoo.reduce(greaterEqualsFoo)).toEqual(Filter.greater("foo"));
                        expect(fromBarToFoo.reduce(greaterEqualsKhaz)).toBe(greaterEqualsKhaz);
                    }
                });

                it("in", () => {
                    // in
                    let completely = filter(Filter.memberOf(["bar", "foo"]));
                    let transformed = filter(Filter.memberOf(["bar", "foo", "khaz"]));
                    let partially = filter(Filter.memberOf(["bar", "foo", "khaz", "mo"]));
                    let untouched = filter(Filter.memberOf(["khaz", "mo"]));

                    expect(fromBarToFoo.reduce(completely)).toBeNull();
                    expectCriteria(fromBarToFoo.reduce(transformed)).toEqual(Filter.equals("khaz"));
                    expectCriteria(fromBarToFoo.reduce(partially)).toEqual(Filter.memberOf(["khaz", "mo"]));
                    expect(fromBarToFoo.reduce(untouched)).toBe(untouched);

                    // not-in
                    let alwaysUntouched = filter(Filter.notMemberOf(["foo", "bar"]));

                    expect(fromBarToFoo.reduce(alwaysUntouched)).toBe(alwaysUntouched);
                });

                it("from-to", () => {
                    let fromAtoBar = filter(Filter.inRange("a", "dan"));
                    let fromBazToKhaz = filter(Filter.inRange("baz", "khaz"));
                    let fromBaztoDan = filter(Filter.inRange("baz", "dan"));
                    let fromAtoKhaz = filter(Filter.inRange("a", "khaz"));
                    let fromKhazToMo = filter(Filter.inRange("khaz", "mo"));

                    expectCriteria(fromBarToFoo.reduce(fromAtoBar)).toEqual(Filter.inRange("a", "bar"));
                    expectCriteria(fromBarToFoo.reduce(fromBazToKhaz)).toEqual(Filter.inRange("foo", "khaz"));
                    expect(fromBarToFoo.reduce(fromBaztoDan)).toBeNull();
                    expect(fromBarToFoo.reduce(fromAtoKhaz)).toBe(fromAtoKhaz);
                    expect(fromBarToFoo.reduce(fromKhazToMo)).toBe(fromKhazToMo);
                });
            });

            describe("date", () => {
                let from2016to2018 = filter(Filter.inRange(makeDate(2016), makeDate(2018)));

                it("==", () => {
                    let equals2017 = filter(Filter.equals(makeDate(2017)));
                    let equals2018 = filter(Filter.equals(makeDate(2018)));
                    let equals2019 = filter(Filter.equals(makeDate(2019)));

                    expect(from2016to2018.reduce(equals2017)).toBeNull();
                    expect(from2016to2018.reduce(equals2018)).toBeNull();
                    expect(from2016to2018.reduce(equals2019)).toBe(equals2019);
                });

                it("< / <= / > / >=", () => {
                    {
                        // <
                        let less2017 = filter(Filter.less(makeDate(2017)));
                        let less2016 = filter(Filter.less(makeDate(2016)));

                        expectCriteria(from2016to2018.reduce(less2017)).toEqual(Filter.less(makeDate(2016)));
                        expect(from2016to2018.reduce(less2016)).toBe(less2016);
                    }

                    {
                        // <=
                        let lessEquals2016 = filter(Filter.lessEquals(makeDate(2016)));
                        let lessEquals2015 = filter(Filter.lessEquals(makeDate(2015)));

                        expectCriteria(from2016to2018.reduce(lessEquals2016)).toEqual(Filter.less(makeDate(2016)));
                        expect(from2016to2018.reduce(lessEquals2015)).toBe(lessEquals2015);
                    }

                    {
                        // >
                        let greater2017 = filter(Filter.greater(makeDate(2017)));
                        let greater2018 = filter(Filter.greater(makeDate(2018)));

                        expectCriteria(from2016to2018.reduce(greater2017)).toEqual(Filter.greater(makeDate(2018)));
                        expect(from2016to2018.reduce(greater2018)).toBe(greater2018);
                    }

                    {
                        // >=
                        let greaterEquals2018 = filter(Filter.greaterEquals(makeDate(2018)));
                        let greaterEquals2019 = filter(Filter.greaterEquals(makeDate(2019)));

                        expectCriteria(from2016to2018.reduce(greaterEquals2018)).toEqual(Filter.greater(makeDate(2018)));
                        expect(from2016to2018.reduce(greaterEquals2019)).toBe(greaterEquals2019);
                    }
                });

                it("from-to", () => {
                    let from2015to2017 = filter(Filter.inRange(makeDate(2015), makeDate(2017)));
                    let from2017to2019 = filter(Filter.inRange(makeDate(2017), makeDate(2019)));
                    let fromSecondOf2016toLastOf2018 = filter(Filter.inRange(makeDate(2016, 1), makeDate(2018, -1)));
                    let from2013to2020 = filter(Filter.inRange(makeDate(2013), makeDate(2020)));
                    let from2020to2030 = filter(Filter.inRange(makeDate(2020), makeDate(2030)));

                    expectCriteria(from2016to2018.reduce(from2015to2017)).toEqual(Filter.inRange(makeDate(2015), makeDate(2016)));
                    expectCriteria(from2016to2018.reduce(from2017to2019)).toEqual(Filter.inRange(makeDate(2018), makeDate(2019)));
                    expect(from2016to2018.reduce(fromSecondOf2016toLastOf2018)).toBeNull();
                    expect(from2016to2018.reduce(from2013to2020)).toBe(from2013to2020);
                    expect(from2016to2018.reduce(from2020to2030)).toBe(from2020to2030);
                });
            });
        });
    });
});
