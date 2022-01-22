import { intersecting } from "./intersecting.fn";

describe("intersecting criteria", () => {
    // binary
    intersecting("is-true").with("is-true").shouldBe("is-true");
    intersecting("is-true").with("is-false").shouldBe(false);

    // set
    intersecting("{1, 2, 3}").with("{2}").shouldBe("{2}");

    // not-in-set
    intersecting("!{2}").with("!{7}").shouldBe("!{2, 7}");

    // range
    intersecting("[1, 7]").with("[3, 5]").shouldBe("[3, 5]");
    intersecting("[3, 5]").with("[1, 7]").shouldBe("[3, 5]");
    intersecting("[1, 7]").with("[5, 9]").shouldBe("[5, 7]");
    intersecting("[1, ...]").with("[3, ...]").shouldBe("[3, ...]");
    intersecting("[..., 7]").with("[..., -1]").shouldBe("[..., -1]");
    intersecting("[3, 7]").with("[1, 4]").shouldBe("[3, 4]");
    intersecting("[1, 7]").with("[0, 8]").shouldBe("[1, 7]");
    intersecting("[1, 7]").with("[8, 10]").shouldBe(false);
    intersecting("[1, 7]").with("(3, 5)").shouldBe("(3, 5)");

    // or-criteria
    intersecting("[1, 7] | [10, 13]").with("[3, 9]").shouldBe("[3, 7]");
    intersecting("[1, 7] | [10, 13]").with("[3, 11]").shouldBe("[3, 7] | [10, 11]");
    intersecting("[1, 7] | [10, 13]").with("[3, 11] | [13, 17]").shouldBe("[3, 7] | [10, 11] | [13, 13]");
});
