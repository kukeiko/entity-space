import { expectCriteria } from "./expect-criteria.fn";

describe("criteria: merging", () => {
    // value
    expectCriteria("true").mergedWith("true").toEqual("true");
    expectCriteria("true").mergedWith("false").toEqual("{true, false}");
    expectCriteria("false").mergedWith("false").toEqual("false");
    expectCriteria("even").mergedWith("even").toEqual("even");
    expectCriteria("odd").mergedWith("odd").toEqual("odd");
    expectCriteria("null").mergedWith("null").toEqual("null");
    expectCriteria("!null").mergedWith("!null").toEqual("!null");

    // range
    expectCriteria("[1, 7]").mergedWith("[3, 5]").toEqual("[1, 7]");
    expectCriteria("[3, 5]").mergedWith("[1, 7]").toEqual("[1, 7]");
    expectCriteria("[1, 7]").mergedWith("[3, 9]").toEqual("[1, 9]");
    expectCriteria("[1, ...]").mergedWith("[3, 5]").toEqual("[1, ...]");
    expectCriteria("[..., 7]").mergedWith("[3, 5]").toEqual("[..., 7]");
    expectCriteria("[1, 3]").mergedWith("[5, 7]").toEqual(false);
    expectCriteria("[1, 7]").mergedWith("(7, 13]").toEqual("[1, 13]");
    expectCriteria("[1, 7]").mergedWith("[-7, 1)").toEqual("[-7, 7]");

    // [todo] left as a reminder to myself
    // [todo] should actually be "all" instead of "[..., ...]"
    expectCriteria("(7, ...]", xit).mergedWith("[..., 10)").toEqual("[..., ...]");

    // in-set
    expectCriteria("{1, 2, 3}").mergedWith("{4, 5, 6}").toEqual("{1, 2, 3, 4, 5, 6}");

    // not-in-set
    expectCriteria("!{1, 2, 3}").mergedWith("!{4, 5, 6}").toEqual("!{1, 2, 3, 4, 5, 6}");

    // or-criteria
    expectCriteria("[1, 7] | [10, 20]").mergedWith("[7, 10]").toEqual("[1, 20]");
    expectCriteria("[7, 10]").mergedWith("[1, 7] | [10, 20]").toEqual("[1, 20]");
    expectCriteria("[1, 7]").mergedWith("[7, 10] | [20, 30]").toEqual("[1, 10] | [20, 30]");
    expectCriteria("[1, 7] | [10, 20]").mergedWith("[7, 10] | [20, 30]").toEqual("[1, 30]");

    expectCriteria("{ price: [100, 200], rating: [3, 5] } | { price: [100, 300], rating: [5, 7] }")
        .mergedWith("{ price: [0, 1000], rating: [0, 8] }")
        .toEqual("{ price: [0, 1000], rating: [0, 8] }");

    // named-criteria
    expectCriteria("{ foo: [1, 7] }").mergedWith("{ foo: [3, 13] }").toEqual("{ foo: [1, 13] }");
    expectCriteria("{ foo: [1, 7] }").mergedWith("{ foo: [8, 13] }").toEqual("{ foo: [1, 13] }");

    expectCriteria("{ foo: [1, 7], bar: [3, 5] }")
        .mergedWith("{ foo: [1, 7], bar: [5, 7] }")
        .toEqual("{ foo: [1, 7], bar: [3, 7] }");

    expectCriteria("{ foo: [1, 7], bar: [3, 5] }")
        .mergedWith("{ foo: [7, 13], bar: [3, 5] }")
        .toEqual("{ foo: [1, 13], bar: [3, 5] }");

    expectCriteria("{ foo: [1, 7], bar: [3, 5] }").mergedWith("{ foo: [2, 6], bar: [5, 7] }").toEqual(false);
});
