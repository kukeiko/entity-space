import { Filter } from "./filter";

function filter(criterion: Filter.Criterion): Filter {
    return new Filter({ foo: criterion });
}

function get(filter: Filter): Filter.Criterion {
    return filter.criteria.foo;
}

function expectArray(filter: Filter) {
    return expect(Array.from((get(filter) as Filter.NumberSetCriterion).values as Set<any>));
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
                id: { op: "in", type: "number", values: new Set([1, 2, 3, 4]), },
                flag: { op: "!=", type: "bool", value: false },
                date: { op: "from-to", type: "date", range: [new Date(2017, 4), new Date(2017, 7)] }
            });

            expect(filter.filter(items)).toEqual(expected);
        });
    });

    describe("reduce()", () => {
        {
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
                it("== / !=", () => {
                    let isTrue = filter(Filter.equals(true));

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

                it("throws if criteria are incompatible", () => {
                    let equals = filter(Filter.equals(true));
                    let invalid = filter({ op: "invalid" as any, type: "bool", value: true });

                    expect(() => equals.reduce(invalid)).toThrow();
                });
            });

            describe("number", () => {
                it("== / !=", () => {
                    let is7 = filter(Filter.equals(7));

                    let alsoIs7 = filter(Filter.equals(7));
                    expect(is7.reduce(alsoIs7)).toBeNull();

                    let is8 = filter(Filter.equals(8));
                    expect(is7.reduce(is8)).toEqual(is8);

                    let not6 = filter(Filter.notEquals(6));
                    expect(is7.reduce(not6)).toEqual(not6);
                });

                it("< / <= / > / >=", () => {
                    let is7 = filter({ op: "==", type: "number", value: 7, step: 1 });

                    // reduces
                    {
                        let lessThan8 = filter(Filter.lessThan(8, 1));
                        expectCriteria(is7.reduce(lessThan8)).toEqual(Filter.lessThan(7, 1));

                        let lessThanEquals7 = filter(Filter.lessThanEquals(7, 1));
                        expectCriteria(is7.reduce(lessThanEquals7)).toEqual(Filter.lessThan(7, 1));

                        let greaterThan6 = filter(Filter.greaterThan(6, 1));
                        expectCriteria(is7.reduce(greaterThan6)).toEqual(Filter.greaterThan(7, 1));

                        let greaterThanEquals7 = filter({ op: ">=", type: "number", value: 7, step: 1 });
                        expectCriteria(is7.reduce(greaterThanEquals7)).toEqual(Filter.greaterThan(7, 1));
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

                it("in / common", () => {
                    let equals = filter(Filter.equals(7));

                    let inside = filter({ op: "in", type: "number", values: new Set([-1, 7, 64]) });
                    let insideReduced = equals.reduce(inside);

                    let common = filter({ op: "common", type: "number", values: new Set([-1, 7, 64]) });
                    let commonReduced = equals.reduce(common);

                    expectArray(insideReduced).toEqual([-1, 64]);
                    expectArray(commonReduced).toEqual([-1, 64]);
                });

                it("from-to", () => {
                    let equals = filter(Filter.equals(7));

                    let lowerBound = filter({ op: "from-to", type: "number", range: [7, 64], step: 1 });
                    expectCriteria(equals.reduce(lowerBound)).toEqual({ op: "from-to", type: "number", range: [8, 64], step: 1 });

                    let higherBound = filter({ op: "from-to", type: "number", range: [-13, 7], step: 1 });
                    expectCriteria(equals.reduce(higherBound)).toEqual({ op: "from-to", type: "number", range: [-13, 6], step: 1 });
                });

                it("throws if criteria are incompatible", () => {
                    let equals = filter(Filter.equals(7));

                    // had to use "invalid" since it covers all ops
                    let invalid = filter({ op: "invalid" as any, type: "number", value: 7 });

                    expect(() => equals.reduce(invalid)).toThrow();
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

                it("throws if criteria are incompatible", () => {
                    let unequals = filter(Filter.notEquals(true));
                    let invalid = filter({ op: "invalid" as any, type: "bool", value: true });

                    expect(() => unequals.reduce(invalid)).toThrow();
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

            it("in / common", () => {
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
