import { reducing } from "./reducing.fn";

describe("reducing: or-criteria", () => {
    reducing("[1, 7] | [10, 13]").by("[1, 13]").shouldBe(true);
    reducing("[1, 7] | [10, 13]").by("[1, 12]").shouldBe("(12, 13]");
    reducing("[1, 7] | [10, 13]").by("[7, 10]").shouldBe("[1, 7) | (10, 13]");
});
