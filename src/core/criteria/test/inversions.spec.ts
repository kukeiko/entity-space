import { inverting, xinverting } from "./inverting.fn";

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

    // or-criteria
    // [todo] i want case B to work instead of case A https://github.com/kukeiko/entity-space/issues/88
    // case A:
    inverting("[1, 7] | [10, 13]").shouldBe("[..., 1) | (7, ...] | [..., 10) | (13, ...]");
    // case B:
    xinverting("[1, 7] | [10, 13]").shouldBe("[..., 1) | (7, 10) | (13, ...]");

    // and-criteria
    xinverting("[1, 7] & is-even").shouldBe("([..., 1) | (7, ...]) | ([1, 7] & is-odd)");
});