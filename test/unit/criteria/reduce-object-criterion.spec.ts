import { createFromToValueCriterion, createInValueCriterion, reduceObjectCriterion } from "src";

// [todo] we're only testing "in" criteria here, but not "not-in" & "from-to"
describe("reduceObjectCriterion()", () => {
    describe("full reduction", () => {
        it("{ foo in [2], bar in [3, 4, 7] } should be completely reduced by { foo in [2], bar in [3, 4, 7] }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3, 4, 7])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3, 4, 7])],
            };

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced).toEqual([]);
        });

        it("{ foo in [2], bar in [3] } should be completely reduced by { foo in [2] }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
            };

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced).toEqual([]);
        });

        it("{ foo in [2], bar in [3] } should be completely reduced by {  }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3])],
            };

            const b = {};

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced).toEqual([]);
        });
    });

    describe("partial reduction", () => {
        it("{ foo in [2, 3] } reduced by { foo in [3, 4] } should be { foo in [2] }", () => {
            // arrange
            const a = { foo: [createInValueCriterion([2, 3])] };
            const b = { foo: [createInValueCriterion([3, 4])] };
            const expected = [{ foo: [createInValueCriterion([2])] }];

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ foo in [1, 2], bar in [3] } reduced by { foo in [2] } should be { foo in [1], bar in [3] }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([1, 2])],
                bar: [createInValueCriterion([3])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
            };

            const expected = [
                {
                    foo: [createInValueCriterion([1])],
                    bar: [createInValueCriterion([3])],
                },
            ];

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ foo in [1, 2], bar in [3] } reduced by { foo in [2], bar in [3, 4] } should be { foo in [1], bar in [3] }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([1, 2])],
                bar: [createInValueCriterion([3])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3, 4])],
            };

            const expected = [
                {
                    foo: [createInValueCriterion([1])],
                    bar: [createInValueCriterion([3])],
                },
            ];

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ foo:[1, 7], bar:[100, 200] } reduced by { foo:[3, 4], bar:[150, 175] } should be { foo:([1, 3), (4, 7]), bar:[100, 200] }, { foo:[3, 4], bar:([100, 150), (175, 200]) }", () => {
            // arrange
            const a = {
                foo: [createFromToValueCriterion([1, 7])],
                bar: [createFromToValueCriterion([100, 200])],
            };

            const b = {
                foo: [createFromToValueCriterion([3, 4])],
                bar: [createFromToValueCriterion([150, 175])],
            };

            const expected = [
                {
                    foo: [createFromToValueCriterion([1, 3], [true, false]), createFromToValueCriterion([4, 7], [false, true])],
                    bar: [createFromToValueCriterion([100, 200])],
                },
                {
                    foo: [createFromToValueCriterion([3, 4])],
                    bar: [createFromToValueCriterion([100, 150], [true, false]), createFromToValueCriterion([175, 200], [false, true])],
                },
            ];

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        it("{ foo:[1, 7], bar:[100, 200], baz:[50, 70] } reduced by { foo:[3, 4], bar:[150, 175] } should be { foo:([1, 3), (4, 7]), bar:[100, 200], baz:[50, 70] }, { foo:[3, 4], bar:([100, 150), (175, 200]), baz:[50, 70] }", () => {
            // arrange
            const a = {
                foo: [createFromToValueCriterion([1, 7])],
                bar: [createFromToValueCriterion([100, 200])],
                baz: [createFromToValueCriterion([50, 70])],
            };

            const b = {
                foo: [createFromToValueCriterion([3, 4])],
                bar: [createFromToValueCriterion([150, 175])],
            };

            const expected = [
                {
                    foo: [createFromToValueCriterion([1, 3], [true, false]), createFromToValueCriterion([4, 7], [false, true])],
                    bar: [createFromToValueCriterion([100, 200])],
                    baz: [createFromToValueCriterion([50, 70])],
                },
                {
                    foo: [createFromToValueCriterion([3, 4])],
                    bar: [createFromToValueCriterion([100, 150], [true, false]), createFromToValueCriterion([175, 200], [false, true])],
                    baz: [createFromToValueCriterion([50, 70])],
                },
            ];

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        fit("{ foo:[1, 7], bar:[100, 200], baz:[50, 70] } reduced by { foo:[3, 4], bar:[150, 175], baz:[55, 65] } should be { foo:([1, 3), (4, 7]), bar:[100, 200], baz:[50, 70] }, { foo:[3, 4], bar:([100, 150), (175, 200]), baz:[50, 70] }, { foo:[3, 4], bar:[150, 175], baz:([50, 55), (65, 70]) }", () => {
            // arrange
            const a = {
                foo: [createFromToValueCriterion([1, 7])],
                bar: [createFromToValueCriterion([100, 200])],
                baz: [createFromToValueCriterion([50, 70])],
            };

            const b = {
                foo: [createFromToValueCriterion([3, 4])],
                bar: [createFromToValueCriterion([150, 175])],
                baz: [createFromToValueCriterion([55, 65])],
            };

            const expected = [
                {
                    foo: [createFromToValueCriterion([1, 3], [true, false]), createFromToValueCriterion([4, 7], [false, true])],
                    bar: [createFromToValueCriterion([100, 200])],
                    baz: [createFromToValueCriterion([50, 70])],
                },
                {
                    foo: [createFromToValueCriterion([3, 4])],
                    bar: [createFromToValueCriterion([100, 150], [true, false]), createFromToValueCriterion([175, 200], [false, true])],
                    baz: [createFromToValueCriterion([50, 70])],
                },
                {
                    foo: [createFromToValueCriterion([3, 4])],
                    bar: [createFromToValueCriterion([150, 175])],
                    baz: [createFromToValueCriterion([50, 55], [true, false]), createFromToValueCriterion([65, 70], [false, true])],
                },
            ];

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });

        /**
         * [todo] need "invertCriterion()" @ reduceObjectCriterion() for this case
         */
        xit("{ foo:[1, 7], bar:[100, 200] } reduced by { foo:[3, 4], bar:[150, 175], baz:[50, 70] } should be { foo:([1, 3), (4, 7]), bar:[100, 200] }, { foo:[3, 4], bar:([100, 150), (175, 200]), baz:([..., 50), (70, ...]) }", () => {
            // arrange
            const a = {
                foo: [createFromToValueCriterion([1, 7])],
                bar: [createFromToValueCriterion([100, 200])],
            };

            const b = {
                foo: [createFromToValueCriterion([3, 4])],
                bar: [createFromToValueCriterion([150, 175])],
                baz: [createFromToValueCriterion([50, 70])],
            };

            const expected = [
                {
                    foo: [createFromToValueCriterion([1, 3], [true, false]), createFromToValueCriterion([4, 7], [false, true])],
                    bar: [createFromToValueCriterion([100, 200])],
                },
                {
                    foo: [createFromToValueCriterion([3, 4])],
                    bar: [createFromToValueCriterion([100, 150], [true, false]), createFromToValueCriterion([175, 200], [false, true])],
                    baz: [createFromToValueCriterion([void 0, 50], false), createFromToValueCriterion([70, void 0], false)],
                },
            ];

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced).toEqual(expected);
        });
    });

    describe("no reduction", () => {
        it("{ foo in [3] } should not be reduced by { foo in [2] }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([3])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
            };

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced[0]).toBe(a);
        });

        it("{ foo in [2] } should not be reduced by { foo in [2], bar in [3] }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([2])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3])],
            };

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced[0]).toBe(a);
        });

        it("{ foo in [2], bar in [3] } should not be reduced by { foo in [2], bar in [4] }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([3])],
            };

            const b = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([4])],
            };

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced[0]).toBe(a);
        });

        it("{ foo in [2] } should not be reduced by { bar in [2] }", () => {
            // arrange
            const a = {
                foo: [createInValueCriterion([2])],
            };

            const b = {
                bar: [createInValueCriterion([2])],
            };

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced[0]).toBe(a);
        });

        it("{ } should not be reduced by { foo in [2], bar in [4] }", () => {
            // arrange
            const a = {};

            const b = {
                foo: [createInValueCriterion([2])],
                bar: [createInValueCriterion([4])],
            };

            // act
            const reduced = reduceObjectCriterion(a, b);

            // assert
            expect(reduced[0]).toBe(a);
        });
    });
});
