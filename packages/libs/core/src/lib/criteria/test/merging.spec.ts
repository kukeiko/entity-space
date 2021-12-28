import { merging, xmerging } from "./merging.fn";

describe("merging criteria", () => {
    // binary
    merging("is-true").with("is-true").shouldBe("is-true");
    merging("is-false").with("is-false").shouldBe("is-false");
    merging("is-even").with("is-even").shouldBe("is-even");
    merging("is-odd").with("is-odd").shouldBe("is-odd");
    merging("is-null").with("is-null").shouldBe("is-null");
    merging("is-not-null").with("is-not-null").shouldBe("is-not-null");

    // range
    merging("[1, 7]").with("[3, 5]").shouldBe("[1, 7]");
    merging("[3, 5]").with("[1, 7]").shouldBe("[1, 7]");
    merging("[1, 7]").with("[3, 9]").shouldBe("[1, 9]");
    merging("[1, ...]").with("[3, 5]").shouldBe("[1, ...]");
    merging("[..., 7]").with("[3, 5]").shouldBe("[..., 7]");
    merging("[1, 3]").with("[5, 7]").shouldBe(false);

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
});
