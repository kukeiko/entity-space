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
                        let lessThan8 = filter(Filter.lessThan(8, 1));
                        let lessThanEquals7 = filter(Filter.lessThanEquals(7, 1));
                        let greaterThan6 = filter(Filter.greaterThan(6, 1));
                        let greaterThanEquals7 = filter(Filter.greaterThanEquals(7));

                        expectCriteria(is7.reduce(lessThan8)).toEqual(Filter.lessThan(7));
                        expectCriteria(is7.reduce(lessThanEquals7)).toEqual(Filter.lessThan(7));
                        expectCriteria(is7.reduce(greaterThan6)).toEqual(Filter.greaterThan(7));
                        expectCriteria(is7.reduce(greaterThanEquals7)).toEqual(Filter.greaterThan(7));
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

                    let lessThan3 = filter(Filter.lessThan(3));
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
                        let untouched = filter(Filter.lessThan("bar"));
                        expect(isFoo.reduce(untouched)).toBe(untouched);
                    }

                    {
                        // <= 
                        let partially = filter(Filter.lessThanEquals("foo"));
                        let untouched = filter(Filter.lessThanEquals("bar"));

                        expectCriteria(isFoo.reduce(partially)).toEqual(Filter.lessThan("foo"));
                        expect(isFoo.reduce(untouched)).toBe(untouched);
                    }

                    {
                        // >
                        let untouched = filter(Filter.greaterThan("bar"));
                        expect(isFoo.reduce(untouched)).toBe(untouched);
                    }

                    {
                        // >=
                        let partially = filter(Filter.greaterThanEquals("foo"));
                        let untouched = filter(Filter.greaterThanEquals("bar"));

                        expectCriteria(isFoo.reduce(partially)).toEqual(Filter.greaterThan("foo"));
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

                    let lessThanFoo = filter(Filter.lessThan("foo"));
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
                let lessThan7 = filter(Filter.lessThan(7));

                it("== / !=", () => {
                    // ==
                    let equals3 = filter(Filter.equals(3));
                    let equals7 = filter(Filter.equals(7));
                    let equals8 = filter(Filter.equals(8));

                    expect(lessThan7.reduce(equals3)).toBeNull();
                    expect(lessThan7.reduce(equals7)).toBe(equals7);
                    expect(lessThan7.reduce(equals8)).toBe(equals8);

                    // !=
                    let not3 = filter(Filter.notEquals(3));
                    let not7 = filter(Filter.notEquals(3));
                    let not8 = filter(Filter.notEquals(8));

                    expectCriteria(lessThan7.reduce(not3)).toEqual(Filter.greaterThanEquals(7));
                    expectCriteria(lessThan7.reduce(not7)).toEqual(Filter.greaterThanEquals(7));
                    expectCriteria(lessThan7.reduce(not8)).toEqual(Filter.greaterThanEquals(7));
                });

                it("< / <=", () => {
                    // <
                    let lessThan3 = filter(Filter.lessThan(3));
                    let alsoLessThan7 = filter(Filter.lessThan(7));
                    let lessThan8 = filter(Filter.lessThan(8));
                    let lessThan9 = filter(Filter.lessThan(9));

                    expect(lessThan7.reduce(lessThan3)).toBeNull();
                    expect(lessThan7.reduce(alsoLessThan7)).toBeNull();
                    expectCriteria(lessThan7.reduce(lessThan8)).toEqual(Filter.equals(7));
                    expectCriteria(lessThan7.reduce(lessThan9)).toEqual(Filter.inRange(7, 8));

                    // <=
                    let lessThanEquals3 = filter(Filter.lessThanEquals(3));
                    let lessThanEquals7 = filter(Filter.lessThanEquals(7));
                    let lessThanEquals8 = filter(Filter.lessThanEquals(8));

                    expect(lessThan7.reduce(lessThanEquals3)).toBeNull();
                    expectCriteria(lessThan7.reduce(lessThanEquals7)).toEqual(Filter.equals(7));
                    expectCriteria(lessThan7.reduce(lessThanEquals8)).toEqual(Filter.inRange(7, 8));
                });

                it("> / >=", () => {
                    // >
                    let greaterThan3 = filter(Filter.greaterThan(3));
                    let greaterThan6 = filter(Filter.greaterThan(6));

                    expectCriteria(lessThan7.reduce(greaterThan3)).toEqual(Filter.greaterThanEquals(7));
                    expect(lessThan7.reduce(greaterThan6)).toBe(greaterThan6);

                    // >=
                    let greaterEquals6 = filter(Filter.greaterThanEquals(6));
                    let greaterEquals7 = filter(Filter.greaterThanEquals(7));

                    expectCriteria(lessThan7.reduce(greaterEquals6)).toEqual(Filter.greaterThanEquals(7));
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
