import { reducing } from "./reducing.fn";

describe("reducing: or-criteria", () => {
    reducing("[1, 7] | [10, 13]").by("[1, 13]").is(true);
    reducing("[1, 7] | [10, 13]").by("[1, 12]").is("(12, 13]");
    reducing("[1, 7] | [10, 13]").by("[7, 10]").is("[1, 7) | (10, 13]");
});
