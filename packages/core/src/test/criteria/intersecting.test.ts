import { expectCriteria } from "../tools/expect-criteria.fn";

describe("criteria: intersecting", () => {
    // equals
    expectCriteria("true").intersectedWith("true").toEqual("true");
    expectCriteria("true").intersectedWith("false").toEqual(false);
    expectCriteria("1").intersectedWith("{-1, 0, 1}").toEqual("1");
    expectCriteria("1").intersectedWith("[1, 3]").toEqual("1");
    expectCriteria("1").intersectedWith("(1, 3]").toEqual(false);

    // in-array
    expectCriteria("{1, 2, 3}").intersectedWith("2").toEqual("2");
    expectCriteria("{1, 2, 3}").intersectedWith("{4}").toEqual(false);
    expectCriteria("{1, 2, 3}").intersectedWith("[1, 2]").toEqual("{1, 2}");
    expectCriteria("{1, 2, 3}").intersectedWith("(1, 2]").toEqual("2");
    expectCriteria("{1, 2, 3}").intersectedWith("!{1, 2, 3}").toEqual(false);
    expectCriteria("{1, 2, 3}").intersectedWith("!{1, 2}").toEqual("3");

    // not-in-array
    expectCriteria("!{2}").intersectedWith("!{7}").toEqual("!{2, 7}");
    expectCriteria("!{2}").intersectedWith("{1, 2, 3}").toEqual("{1, 3}");
    expectCriteria("!{2}").intersectedWith("{1, 2}").toEqual("1");
    expectCriteria("!{7}").intersectedWith("8").toEqual("8");

    // in-range
    expectCriteria("[1, 7]").intersectedWith("[3, 5]").toEqual("[3, 5]");
    expectCriteria("[3, 5]").intersectedWith("[1, 7]").toEqual("[3, 5]");
    expectCriteria("[1, 7]").intersectedWith("[5, 9]").toEqual("[5, 7]");
    expectCriteria("[1, ...]").intersectedWith("[3, ...]").toEqual("[3, ...]");
    expectCriteria("[..., 7]").intersectedWith("[..., -1]").toEqual("[..., -1]");
    expectCriteria("[3, 7]").intersectedWith("[1, 4]").toEqual("[3, 4]");
    expectCriteria("[1, 7]").intersectedWith("[0, 8]").toEqual("[1, 7]");
    expectCriteria("[1, 7]").intersectedWith("[8, 10]").toEqual(false);
    expectCriteria("[1, 7]").intersectedWith("(3, 5)").toEqual("(3, 5)");

    expectCriteria("{ price: [100, 300], rating: [3, 7] }")
        .intersectedWith("{ price: [100, 200], rating: [3, 5] }")
        .toEqual("{ price: [100, 200], rating: [3, 5] }");

    expectCriteria("{ price: [100, 300], rating: [3, 7] }")
        .intersectedWith("{ price: [100, 200], rating: [3, 5] } | { price: (200, 300], rating: [3, 5] }")
        .toEqual("{ price: [100, 200], rating: [3, 5] } | { price: (200, 300], rating: [3, 5] }");

    // all
    expectCriteria("all").intersectedWith("all").toEqual("all");
    expectCriteria("all").intersectedWith("none").toEqual("none");

    // none
    expectCriteria("none").intersectedWith("none").toEqual("none");
    expectCriteria("none").intersectedWith("all").toEqual("none");
    expectCriteria("none").intersectedWith("1").toEqual("none");
    expectCriteria("none").intersectedWith("{1, 2}").toEqual("none");
    expectCriteria("none").intersectedWith("1 | 2").toEqual("none");
    expectCriteria("none").intersectedWith("[..., 9]").toEqual("none");
    expectCriteria("none").intersectedWith("{ foo: 1, bar: 2 }").toEqual("none");

    // or-criteria
    expectCriteria("[1, 7] | [10, 13]").intersectedWith("[3, 9]").toEqual("[3, 7]");
    expectCriteria("[1, 7] | [10, 13]").intersectedWith("[3, 11]").toEqual("[3, 7] | [10, 11]");
    expectCriteria("[1, 7] | [10, 13]").intersectedWith("[3, 11] | [13, 17]").toEqual("[3, 7] | [10, 11] | [13, 13]");

    // entity-criteria
    expectCriteria("{ foo: {1,2,3} }").intersectedWith("{ foo: {2} }").toEqual("{ foo: 2 }");
    expectCriteria("{ foo: {1,2,3} }").intersectedWith("{ bar: {2} }").toEqual("{ foo: {1,2,3}, bar: {2} }");
    expectCriteria("{ foo: {1,2,3} }").intersectedWith("{ foo: {4,5,6} }").toEqual(false);

    expectCriteria("{ foo: 1, bar: 2 }")
        .intersectedWith("{ foo: 1 } | { bar: 2 }")
        // [todo] shouldn't this just be "{ foo: 1, bar: 2 }"?
        .toEqual("{ foo: 1, bar: 2 } | { bar: 2, foo: 1 }");

    expectCriteria("{ foo: 1, bar: 2 }").intersectedWith("{ foo: 1 } | { bar: 3 }").toEqual("{ foo: 1, bar: 2 }");
    expectCriteria("{ foo: 1, bar: 2 }").intersectedWith("{ foo: 1 } & { bar: 3 }").toEqual(false);

    // [todo] implement this case
    expectCriteria("{ foo: 1, bar: 2 }", xit).intersectedWith("{ foo: 1 } & { bar: 2 }").toEqual("{ foo: 1, bar: 2 }");
});
