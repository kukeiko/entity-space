import { inverting } from "./inverting.fn";

describe("inverting criteria", () => {
    // binary
    inverting("is-even").shouldBe("is-odd");

    // in-set
    inverting("{1, 2, 3}").shouldBe("!{1, 2, 3}");

    // not-in-set
    inverting("!{1, 2, 3}").shouldBe("{1, 2, 3}");

    // in-range
    inverting("[1, 7]").shouldBe("[..., 1) | (7, ...]");
    inverting("(1, 7]").shouldBe("[..., 1] | (7, ...]");
    inverting("(1, 7)").shouldBe("[..., 1] | [7, ...]");
    inverting("[..., 7]").shouldBe("(7, ...]");
    inverting("[7, ...]").shouldBe("[..., 7)");
});
