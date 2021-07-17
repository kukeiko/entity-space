import { inSet } from "../../value-criterion";
import { reducing } from "./reducing.fn";

// [todo] parse errors prevent other specs from running
describe("reducing: in-range", () => {
    describe("full reduction", () => {
        reducing("[1, 7]").by("[1, 7]").is(true);
        reducing("[1, 7]").by("[0, 8]").is(true);
        reducing("[1, 7]").by("(0, 8)").is(true);
        reducing("[1, 7]").by("[0, ...]").is(true);
        reducing("[4, ...]").by("[3, ...]").is(true);
        reducing("[..., 4]").by("[..., 5]").is(true);
        reducing("[1, 7]").by("[..., 9]").is(true);
    });

    describe("partial reduction", () => {
        describe("head reduction", () => {
            reducing("[1, 7]").by("[-3, 5]").is("(5, 7]");
            reducing("[3, ...]").by("[1, 8]").is("(8, ...]");
            reducing("[3, ...]").by("[1, 8)").is("[8, ...]");
            reducing("[1, 7]").by("[..., 3)").is("[3, 7]");
        });

        describe("tail reduction", () => {
            reducing("[1, 7]").by("[3, 10]").is("[1, 3)");
            reducing("[1, 7]").by("(3, 8]").is("[1, 3]");
            reducing("[..., 3]").by("[1, 8]").is("[..., 1)");
            reducing("[..., 3]").by("(1, 8]").is("[..., 1]");
            reducing("[1, 7]").by("[3, ...]").is("[1, 3)");
        });

        describe("body reduction", () => {
            reducing("[1, 7]").by("[3, 4]").is("[1, 3) | (4, 7]");
            reducing("(1, 7)").by("[3, 4]").is("(1, 3) | (4, 7)");
            reducing("(1, 7)").by("(3, 3)").is("(1, 3] | [3, 7)");
            reducing("[..., 7]").by("[3, 4]").is("[..., 3) | (4, 7]");
            reducing("[..., 7]").by("(3, 4)").is("[..., 3] | [4, 7]");
            reducing("[1, ...]").by("[3, 4]").is("[1, 3) | (4, ...]");
            reducing("[1, ...]").by("(3, 4)").is("[1, 3] | [4, ...]");
            reducing("[1, 7]").by("(1, 7)").is("[1, 1] | [7, 7]");
        });

        describe("reduction by: in", () => {
            reducing("[1, 2]").by("{2}").is("[1, 2)");
            reducing("[1, 2]").by("{1}").is("(1, 2]");
            reducing("[1, 2]").by("{1, 2}").is("(1, 2)");
            reducing("[..., 2]").by("{1, 2}").is("[..., 2)");
            reducing("[1, ...]").by("{1, 2}").is("(1, ...]");
        });
    });

    describe("no reduction", () => {
        // [todo] now that we allow for splitting a range into smaller parts we might want this reduction to actually do something
        // (instead of doing nothing). the problem is though that a "from-to" reduced by an "in" with lots of values will create
        // lots of queries and hinder performance. also, it would only work with from-to of type integer (which we don't distinguish yet)
        reducing("[1, 3]")
            .by(inSet([2]))
            .is(false);

        reducing("[1, 7]").by("(7, 13]").is(false);
        reducing("[1, 7]").by("[8, 13]").is(false);
        reducing("[1, 7]").by("[..., 1)").is(false);
        reducing("[1, 7]").by("[..., 0]").is(false);
    });
});
