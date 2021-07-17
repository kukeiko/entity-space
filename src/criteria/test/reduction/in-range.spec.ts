import { inRange, inSet, or } from "../../value-criterion";
import { reducing } from "./reducing.fn";

describe("reducing: in-range", () => {
    describe("full reduction", () => {
        reducing(inRange(1, 7)).by(inRange(1, 7)).is(true);
        reducing(inRange(1, 7)).by(inRange(0, 8)).is(true);
        reducing(inRange(1, 7)).by(inRange(0, 8, false)).is(true);

        reducing(inRange(1, 7))
            .by(inRange(0, void 0))
            .is(true);

        reducing(inRange(4, void 0))
            .by(inRange(3, void 0))
            .is(true);

        reducing(inRange(void 0, 4))
            .by(inRange(void 0, 5))
            .is(true);

        reducing(inRange(1, 7))
            .by(inRange(void 0, 9))
            .is(true);
    });

    describe("partial reduction", () => {
        describe("head reduction", () => {
            reducing(inRange(1, 7))
                .by(inRange(-3, 5))
                .is(inRange(5, 7, [false, true]));

            reducing(inRange(3, void 0))
                .by(inRange(1, 8))
                .is(inRange(8, void 0, false));

            reducing(inRange(3, void 0))
                .by(inRange(1, 8, [true, false]))
                .is(inRange(8, void 0));

            reducing(inRange(1, 7))
                .by(inRange(void 0, 3, false))
                .is(inRange(3, 7));
        });

        describe("tail reduction", () => {
            reducing(inRange(1, 7))
                .by(inRange(3, 10))
                .is(inRange(1, 3, [true, false]));

            reducing(inRange(1, 7))
                .by(inRange(3, 8, [false, true]))
                .is(inRange(1, 3));

            reducing(inRange(void 0, 3))
                .by(inRange(1, 8))
                .is(inRange(void 0, 1, false));

            reducing(inRange(void 0, 3))
                .by(inRange(1, 8, [false, true]))
                .is(inRange(void 0, 1));

            reducing(inRange(1, 7))
                .by(inRange(3, void 0))
                .is(inRange(1, 3, [true, false]));
        });

        describe("body reduction", () => {
            reducing(inRange(1, 7))
                .by(inRange(3, 4))
                .is(or([inRange(1, 3, [true, false]), inRange(4, 7, [false, true])]));

            reducing(inRange(1, 7, false))
                .by(inRange(3, 4))
                .is(or([inRange(1, 3, false), inRange(4, 7, false)]));

            reducing(inRange(1, 7, false))
                .by(inRange(3, 3, false))
                .is(or([inRange(1, 3, [false, true]), inRange(3, 7, [true, false])]));

            reducing(inRange(void 0, 7))
                .by(inRange(3, 4))
                .is(or([inRange(void 0, 3, false), inRange(4, 7, [false, true])]));

            reducing(inRange(void 0, 7))
                .by(inRange(3, 4, false))
                .is(or([inRange(void 0, 3), inRange(4, 7)]));

            reducing(inRange(1, void 0))
                .by(inRange(3, 4))
                .is(or([inRange(1, 3, [true, false]), inRange(4, void 0, false)]));

            reducing(inRange(1, void 0))
                .by(inRange(3, 4, false))
                .is(or([inRange(1, 3), inRange(4, void 0)]));

            reducing(inRange(1, 7))
                .by(inRange(1, 7, false))
                .is(or([inRange(1, 1), inRange(7, 7)]));
        });

        describe("reduction by: in", () => {
            reducing(inRange(1, 2))
                .by(inSet([2]))
                .is(inRange(1, 2, [true, false]));

            reducing(inRange(1, 2))
                .by(inSet([1]))
                .is(inRange(1, 2, [false, true]));

            reducing(inRange(1, 2))
                .by(inSet([1, 2]))
                .is(inRange(1, 2, false));

            reducing(inRange(void 0, 2))
                .by(inSet([1, 2]))
                .is(inRange(void 0, 2, false));

            reducing(inRange(1, void 0))
                .by(inSet([1, 2]))
                .is(inRange(1, void 0, false));
        });
    });

    describe("no reduction", () => {
        // [todo] now that we allow for splitting a range into smaller parts we might want this reduction to actually do something
        // (instead of doing nothing). the problem is though that a "from-to" reduced by an "in" with lots of values will create
        // lots of queries and hinder performance. also, it would only work with from-to of type integer (which we don't distinguish yet)
        reducing(inRange(1, 3))
            .by(inSet([2]))
            .is(false);

        reducing(inRange(1, 7))
            .by(inRange(7, 13, [false, true]))
            .is(false);
        reducing(inRange(1, 7)).by(inRange(8, 13)).is(false);

        reducing(inRange(1, 7))
            .by(inRange(void 0, 1, false))
            .is(false);

        reducing(inRange(1, 7))
            .by(inRange(void 0, 0))
            .is(false);
    });
});
