import { subtracting } from "../tools/subtracting.fn";

describe("subtraction: or-criteria", () => {
    subtracting("[1, 7] | [10, 13]").by("[1, 13]").shouldBe(true);
    subtracting("[1, 7] | [10, 13]").by("[1, 12]").shouldBe("(12, 13]");
    subtracting("[1, 7] | [10, 13]").by("[7, 10]").shouldBe("[1, 7) | (10, 13]");
});
