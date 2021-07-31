import { inverting } from "./inverting.fn";

describe("inverting criteria", () => {
    // binary
    inverting("is-even").is("is-odd");

    // in-set
    inverting("{1, 2, 3}").is("!{1, 2, 3}");

    // not-in-set
    inverting("!{1, 2, 3}").is("{1, 2, 3}");

    // in-range
    inverting("[1, 7]").is("[..., 1) | (7, ...]");
    inverting("(1, 7]").is("[..., 1] | (7, ...]");
    inverting("(1, 7)").is("[..., 1] | [7, ...]");
    inverting("[..., 7]").is("(7, ...]");
    inverting("[7, ...]").is("[..., 7)");
});
