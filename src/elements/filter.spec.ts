import { Filter } from "./filter";

function expectEqualSets(a: Set<any>, b: Set<any>) {
    expect(Array.from(a.values())).toEqual(Array.from(b.values()));
}

describe("filter", () => {
    describe("reduce", () => {
        describe("from-to", () => {
            it("should reduce from-to", () => {
                let a = new Filter({ rank: { op: "from-to", range: [1, 7] } });

                {
                    // A reduces lower bound of B
                    let b = new Filter({ rank: { op: "from-to", range: [3, 9] } });
                    let r = a.reduce(b);
                    expect(r).not.toBeNull();
                    expect(r.criteria).toEqual({ rank: { op: "from-to", range: [8, 9] } });
                }

                {
                    // A reduces higher bound of B
                    let b = new Filter({ rank: { op: "from-to", range: [-3, 3] } });
                    let r = a.reduce(b);
                    expect(r).not.toBeNull();
                    expect(r.criteria).toEqual({ rank: { op: "from-to", range: [-3, 0] } });
                }

                {
                    // A completely reduces B due to being greater than B
                    let b = new Filter({ rank: { op: "from-to", range: [2, 6] } });
                    let r = a.reduce(b);
                    expect(r).toBeNull();
                }

                {
                    // A completely reduces B due to being equal
                    let b = new Filter({ rank: { op: "from-to", range: [1, 7] } });
                    let r = a.reduce(b);
                    expect(r).toBeNull();
                }

                {
                    // A does not reduce B due to being consumed by B
                    let b = new Filter({ rank: { op: "from-to", range: [-3, 9] } });
                    let r = a.reduce(b);
                    expect(r).not.toBeNull();
                    expect(r.criteria).toEqual({ rank: { op: "from-to", range: [-3, 9] } });
                }

                {
                    // A does not reduce B due to non-intersecting ranges
                    let b = new Filter({ rank: { op: "from-to", range: [-64, 0] } });
                    let r = a.reduce(b);
                    expect(r).not.toBeNull();
                    expect(r).toEqual(b);
                }
            });

            it("should reduce ==", () => {
                let a = new Filter({ rank: { op: "from-to", range: [1, 7] } });

                {
                    let b = new Filter({ rank: { op: "==", value: 3 } });
                    let r = a.reduce(b);
                    expect(r).toBeNull();
                }
            });

            it("should reduce <", () => {
                let a = new Filter({ rank: { op: "from-to", range: [1, 7] } });

                {
                    let b = new Filter({ rank: { op: "<", value: 2 } });
                    let r = a.reduce(b);

                    expect(r).not.toBeNull();
                    expect(r.criteria).toEqual({ rank: { op: "<", value: 1 } });
                }

                {
                    let b = new Filter({ rank: { op: "<", value: 8 } });
                    let r = a.reduce(b);

                    expect(r).not.toBeNull();
                    expect(r.criteria).toEqual({ rank: { op: "<", value: 1 } });
                }
            });

            it("should reduce <=", () => {
                let a = new Filter({ rank: { op: "from-to", range: [1, 7] } });

                {
                    let b = new Filter({ rank: { op: "<=", value: 2 } });
                    let r = a.reduce(b);

                    expect(r).not.toBeNull();
                    expect(r.criteria).toEqual({ rank: { op: "<=", value: 0 } });
                }

                {
                    let b = new Filter({ rank: { op: "<=", value: 7 } });
                    let r = a.reduce(b);

                    expect(r).not.toBeNull();
                    expect(r.criteria).toEqual({ rank: { op: "<=", value: 0 } });
                }
            });

            it("should reduce in & intersect", () => {
                let a = new Filter({ rank: { op: "from-to", range: [1, 7] } });

                {
                    let include = new Filter({ rank: { op: "include", values: new Set([1, 2, 3]) } });
                    let intersect = new Filter({ rank: { op: "intersect", values: new Set([1, 2, 3]) } });

                    expect(a.reduce(include)).toBeNull();
                    expect(a.reduce(intersect)).toBeNull();
                }

                {
                    let include = new Filter({ rank: { op: "include", values: new Set([-1, 2, 3, 64]) } });
                    let intersect = new Filter({ rank: { op: "intersect", values: new Set([-1, 2, 3, 64]) } });

                    expect(a.reduce(include)).not.toBeNull();
                    expectEqualSets((a.reduce(include).criteria.rank as Filter.SetCriterion).values, new Set([-1, 64]));
                    expect(a.reduce(intersect)).not.toBeNull();
                    expectEqualSets((a.reduce(intersect).criteria.rank as Filter.SetCriterion).values, new Set([-1, 64]));
                }
            });

            it("should not reduce !=", () => {
                let fromTo = new Filter({ rank: { op: "from-to", range: [1, 7] } });

                let notEquals = new Filter({ rank: { op: "!=", value: 3 } });
                expect(fromTo.reduce(notEquals)).toEqual(notEquals);
            });
        });
    });
});
