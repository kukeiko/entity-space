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
    describe("reduce", () => {
        it("throws if types of criteria are incompatible", () => {
            let bool = filter(Filter.equals(true));
            let number = filter(Filter.equals(7));

            expect(() => bool.reduce(number)).toThrow();
        });

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
                    let equals = filter(Filter.equals(7));

                    let equalEquals = filter(Filter.equals(7));
                    expect(equals.reduce(equalEquals)).toBeNull();

                    let otherEquals = filter(Filter.equals(8));
                    expect(equals.reduce(otherEquals)).toEqual(otherEquals);

                    let notEquals = filter(Filter.notEquals(6));
                    expect(equals.reduce(notEquals)).toEqual(notEquals);
                });

                it("< / <= / > / >=", () => {
                    let equals = filter({ op: "==", type: "number", value: 7, step: 1 });

                    // reduces
                    {
                        let lessThan = filter({ op: "<", type: "number", value: 8, step: 1 });
                        expectCriteria(equals.reduce(lessThan)).toEqual({ op: "<", type: "number", value: 7, step: 1 });

                        let lessThanEquals = filter({ op: "<=", type: "number", value: 7, step: 1 });
                        expectCriteria(equals.reduce(lessThanEquals)).toEqual({ op: "<", type: "number", value: 7, step: 1 });

                        let greaterThan = filter({ op: ">", type: "number", value: 6, step: 1 });
                        expectCriteria(equals.reduce(greaterThan)).toEqual({ op: ">", type: "number", value: 7, step: 1 });

                        let greaterThanEquals = filter({ op: ">=", type: "number", value: 7, step: 1 });
                        expectCriteria(equals.reduce(greaterThanEquals)).toEqual({ op: ">", type: "number", value: 7, step: 1 });
                    }

                    // reduces: stepping
                    {
                        let lessThan = filter({ op: "<", type: "number", value: 7.1, step: 0.1 });
                        expectCriteria(equals.reduce(lessThan)).toEqual({ op: "<", type: "number", value: 7, step: 0.1 });

                        let greaterThan = filter({ op: ">", type: "number", value: 6.9, step: 0.1 });
                        expectCriteria(equals.reduce(greaterThan)).toEqual({ op: ">", type: "number", value: 7, step: 0.1 });
                    }

                    // does'nt reduce: lower bound
                    {
                        let lessThan = filter({ op: "<", type: "number", value: 7, step: 1 });
                        expect(equals.reduce(lessThan)).toEqual(lessThan);

                        let lessThanEquals = filter({ op: "<=", type: "number", value: 6, step: 1 });
                        expect(equals.reduce(lessThanEquals)).toEqual(lessThanEquals);

                        let greaterThan = filter({ op: ">", type: "number", value: 7, step: 1 });
                        expect(equals.reduce(greaterThan)).toEqual(greaterThan);

                        let greaterThanEquals = filter({ op: ">=", type: "number", value: 8, step: 1 });
                        expect(equals.reduce(greaterThanEquals)).toEqual(greaterThanEquals);
                    }

                    // does'nt reduce: higher bound
                    {
                        let lessThan = filter({ op: "<", type: "number", value: 9, step: 1 });
                        expect(equals.reduce(lessThan)).toEqual(lessThan);

                        let lessThanEquals = filter({ op: "<=", type: "number", value: 8, step: 1 });
                        expect(equals.reduce(lessThanEquals)).toEqual(lessThanEquals);

                        let greaterThan = filter({ op: ">", type: "number", value: 5, step: 1 });
                        expect(equals.reduce(greaterThan)).toEqual(greaterThan);

                        let greaterThanEquals = filter({ op: ">=", type: "number", value: 6, step: 1 });
                        expect(equals.reduce(greaterThanEquals)).toEqual(greaterThanEquals);
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
                    expectCriteria(notTrue.reduce(notNull)).toEqual({ op: "==", type: "bool", value: true })
                });

                it("throws if criteria are incompatible", () => {
                    let unequals = filter(Filter.notEquals(true));
                    let invalid = filter({ op: "invalid" as any, type: "bool", value: true });

                    expect(() => unequals.reduce(invalid)).toThrow();
                });
            });
        });
        // describe("from-to", () => {
        //     it("from-to", () => {
        //         let a = filter({ op: "from-to", range: [1, 7], step: 1 });

        //         {
        //             // A reduces lower bound of B
        //             let b = filter({ op: "from-to", range: [3, 9], step: 1 });
        //             let r = a.reduce(b);
        //             expect(r).not.toBeNull();
        //             expect(get(r)).toEqual({ op: "from-to", range: [7, 9], step: 1 });
        //         }

        //         {
        //             // A reduces higher bound of B
        //             let b = filter({ op: "from-to", range: [-3, 3], step: 1 });
        //             let r = a.reduce(b);
        //             expect(r).not.toBeNull();
        //             expect(get(r)).toEqual({ op: "from-to", range: [-3, 1], step: 1 });
        //         }

        //         {
        //             // A completely reduces B due to being greater than B
        //             let b = filter({ op: "from-to", range: [2, 6], step: 1 });
        //             let r = a.reduce(b);
        //             expect(r).toBeNull();
        //         }

        //         {
        //             // A completely reduces B due to being equal
        //             let b = filter({ op: "from-to", range: [1, 7], step: 1 });
        //             let r = a.reduce(b);
        //             expect(r).toBeNull();
        //         }

        //         {
        //             // A does not reduce B due to being consumed by B
        //             let b = filter({ op: "from-to", range: [-3, 9], step: 1 });
        //             let r = a.reduce(b);
        //             expect(r).not.toBeNull();
        //             expect(get(r)).toEqual({ op: "from-to", range: [-3, 9], step: 1 });
        //         }

        //         {
        //             // A does not reduce B due to non-intersecting ranges
        //             let b = filter({ op: "from-to", range: [-64, 0], step: 1 });
        //             let r = a.reduce(b);
        //             expect(r).not.toBeNull();
        //             expect(r).toEqual(b);
        //         }
        //     });

        //     it("==", () => {
        //         let a = filter({ op: "from-to", range: [1, 7], step: 1 });

        //         {
        //             let b = filter({ op: "==", type: "number", value:3 });
        //             let r = a.reduce(b);
        //             expect(r).toBeNull();
        //         }
        //     });

        //     it("<", () => {
        //         let a = filter({ op: "from-to", range: [1, 7], step: 1 });

        //         {
        //             let b = filter({ op: "<", type: "number", value:2, step: 1 });
        //             let r = a.reduce(b);

        //             expect(r).not.toBeNull();
        //             expect(get(r)).toEqual({ op: "<", type: "number", value:1, step: 1 });
        //         }

        //         {
        //             let b = filter({ op: "<", type: "number", value:8, step: 1 });
        //             let r = a.reduce(b);

        //             expect(r).not.toBeNull();
        //             expect(get(r)).toEqual({ op: "<", type: "number", value:1, step: 1 });
        //         }
        //     });

        //     it("<=", () => {
        //         let a = filter({ op: "from-to", range: [1, 7], step: 1 });

        //         {
        //             let b = filter({ op: "<=", type: "number", value:2, step: 1 });
        //             let r = a.reduce(b);

        //             expect(r).not.toBeNull();
        //             expect(get(r)).toEqual({ op: "<", type: "number", value:1, step: 1 });
        //         }

        //         {
        //             let b = filter({ op: "<=", type: "number", value:7, step: 1 });
        //             let r = a.reduce(b);

        //             expect(r).not.toBeNull();
        //             expect(get(r)).toEqual({ op: "<", type: "number", value:1, step: 1 });
        //         }
        //     });

        //     it("in & intersect", () => {
        //         let a = filter({ op: "from-to", range: [1, 7], step: 1 });

        //         {
        //             let include = filter({ op: "in", values: new Set([1, 2, 3]) });
        //             let intersect = filter({ op: "common", values: new Set([1, 2, 3]) });

        //             expect(a.reduce(include)).toBeNull();
        //             expect(a.reduce(intersect)).toBeNull();
        //         }

        //         {
        //             let include = filter({ op: "in", values: new Set([-1, 2, 3, 64]) });
        //             let intersect = filter({ op: "common", values: new Set([-1, 2, 3, 64]) });

        //             expect(a.reduce(include)).not.toBeNull();
        //             expectArray(a.reduce(include)).toEqual([-1, 64]);
        //             expect(a.reduce(intersect)).not.toBeNull();
        //             expectArray(a.reduce(intersect)).toEqual([-1, 64]);
        //         }
        //     });

        //     it("should not reduce !=", () => {
        //         let fromTo = filter({ op: "from-to", range: [1, 7], step: 1 });
        //         let notEquals = filter({ op: "!=", type: "number", value:3 });
        //         expect(fromTo.reduce(notEquals)).toEqual(notEquals);
        //     });
        // });
    });
});
