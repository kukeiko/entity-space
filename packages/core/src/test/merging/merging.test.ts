import { merging, xmerging } from "../tools/merging.fn";

describe("merging criteria", () => {
    // value
    merging("true").with("true").shouldBe("true");
    merging("true").with("false").shouldBe("{true, false}");
    merging("false").with("false").shouldBe("false");
    merging("even").with("even").shouldBe("even");
    merging("odd").with("odd").shouldBe("odd");
    merging("null").with("null").shouldBe("null");
    merging("!null").with("!null").shouldBe("!null");

    // range
    merging("[1, 7]").with("[3, 5]").shouldBe("[1, 7]");
    merging("[3, 5]").with("[1, 7]").shouldBe("[1, 7]");
    merging("[1, 7]").with("[3, 9]").shouldBe("[1, 9]");
    merging("[1, ...]").with("[3, 5]").shouldBe("[1, ...]");
    merging("[..., 7]").with("[3, 5]").shouldBe("[..., 7]");
    merging("[1, 3]").with("[5, 7]").shouldBe(false);
    merging("[1, 7]").with("(7, 13]").shouldBe("[1, 13]");
    merging("[1, 7]").with("[-7, 1)").shouldBe("[-7, 7]");

    // [todo] left as a reminder to myself
    xmerging("(7, ...]").with("[..., 10)").shouldBe("[..., ...]");

    // in-set
    merging("{1, 2, 3}").with("{4, 5, 6}").shouldBe("{1, 2, 3, 4, 5, 6}");

    // not-in-set
    merging("!{1, 2, 3}").with("!{4, 5, 6}").shouldBe("!{1, 2, 3, 4, 5, 6}");

    // or-criteria
    merging("[1, 7] | [10, 20]").with("[7, 10]").shouldBe("[1, 20]");
    merging("[7, 10]").with("[1, 7] | [10, 20]").shouldBe("[1, 20]");
    merging("[1, 7]").with("[7, 10] | [20, 30]").shouldBe("[1, 10] | [20, 30]");
    merging("[1, 7] | [10, 20]").with("[7, 10] | [20, 30]").shouldBe("[1, 30]");

    merging("{ price: [100, 200], rating: [3, 5] } | { price: [100, 300], rating: [5, 7] }")
        .with("{ price: [0, 1000], rating: [0, 8] }")
        .shouldBe("{ price: [0, 1000], rating: [0, 8] }");

    // named-criteria
    merging("{ foo: [1, 7] }").with("{ foo: [3, 13] }").shouldBe("{ foo: [1, 13] }");
    merging("{ foo: [1, 7] }").with("{ foo: [8, 13] }").shouldBe("{ foo: [1, 13] }");

    merging("{ foo: [1, 7], bar: [3, 5] }")
        .with("{ foo: [1, 7], bar: [5, 7] }")
        .shouldBe("{ foo: [1, 7], bar: [3, 7] }");

    merging("{ foo: [1, 7], bar: [3, 5] }")
        .with("{ foo: [7, 13], bar: [3, 5] }")
        .shouldBe("{ foo: [1, 13], bar: [3, 5] }");

    merging("{ foo: [1, 7], bar: [3, 5] }").with("{ foo: [2, 6], bar: [5, 7] }").shouldBe(false);
});
