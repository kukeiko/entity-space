import { expectCriteria } from "./expect-criteria.fn";

describe("criteria: inversions", () => {
    // binary
    expectCriteria("even").inverted().toEqual("odd");
    expectCriteria("odd").inverted().toEqual("even");

    // in-array
    expectCriteria("{1, 2, 3}").inverted().toEqual("!{1, 2, 3}");

    // not-in-array
    expectCriteria("!{1, 2, 3}").inverted().toEqual("{1, 2, 3}");

    // in-range
    expectCriteria("[1, 7]").inverted().toEqual("[..., 1) | (7, ...]");
    expectCriteria("(1, 7]").inverted().toEqual("[..., 1] | (7, ...]");
    expectCriteria("(1, 7)").inverted().toEqual("[..., 1] | [7, ...]");
    expectCriteria("[..., 7]").inverted().toEqual("(7, ...]");
    expectCriteria("[7, ...]").inverted().toEqual("[..., 7)");

    // or-criteria
    // [todo] i want case B to work instead of case A https://github.com/kukeiko/entity-space/issues/88
    // case A:
    expectCriteria("[1, 7] | [10, 13]").inverted().toEqual("[..., 1) | (7, ...] | [..., 10) | (13, ...]");
    // case B:
    expectCriteria("[1, 7] | [10, 13]", xit).inverted().toEqual("[..., 1) | (7, 10) | (13, ...]");

    // and-criteria
    // [todo] want this case to work also. currently returns "([..., 1) | (7, ...] | odd)" which doesn't seem correct.
    // to solve this, it would also be a good idea to look at what i expect the result of inverting "even & [1, 7]" to be.
    expectCriteria("[1, 7] & even", xit).inverted().toEqual("([..., 1) | (7, ...]) | ([1, 7] & odd)");

    // entity criteria
    expectCriteria("{ foo: [0, 7] }").inverted().toEqual("{ foo: [..., 0) | (7, ...] }");
    expectCriteria("{ foo: [0, 7], bar: {1,2,3} }")
        .inverted()
        .toEqual("{ foo: [..., 0) | (7, ...] } | { foo: [0, 7], bar: !{1,2,3} }");
    expectCriteria("{ foo: [0, 7], bar: {1,2,3}, baz: 8 }")
        .inverted()
        .toEqual(
            "{ foo: [..., 0) | (7, ...] } | { foo: [0, 7], bar: !{1,2,3} } | { foo: [0, 7], bar: {1,2,3}, baz: !8}"
        );
});
