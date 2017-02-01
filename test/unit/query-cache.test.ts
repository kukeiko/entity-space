import { Entity, Query, QueryCache } from "../../src";

describe("query-cache", () => {
    describe("isCached()", () => {
        describe("identity only", () => {
            @Entity() class Foo { @Entity.PrimaryKey() id: string; }

            it("Foo(mo) should be cached via Foo(khaz,mo,dan)", () => {
                let cache = new QueryCache();

                let byKeys = new Query.ByKeys({
                    entityType: Foo,
                    keys: ["khaz", "mo", "dan"]
                });

                let byMo = new Query.ByKey({
                    entityType: Foo,
                    key: "mo"
                });

                cache.add(byKeys);

                expect(cache.isCached(byMo)).toBe(true);
            });

            it("Foo(khaz,mo,dan) should be cached via Foo(mo), Foo(dan), Foo(khaz)", () => {
                let cache = new QueryCache();

                let byMo = new Query.ByKey({
                    entityType: Foo,
                    key: "mo"
                });

                let byDan = new Query.ByKey({
                    entityType: Foo,
                    key: "dan"
                });

                let byKhaz = new Query.ByKey({
                    entityType: Foo,
                    key: "khaz"
                });

                let byKeys = new Query.ByKeys({
                    entityType: Foo,
                    keys: ["khaz", "mo", "dan"]
                });

                cache.add(byMo);
                cache.add(byDan);
                cache.add(byKhaz);

                expect(cache.isCached(byKeys)).toBe(true);
            });

            it("Foo(mo,zul) should be cached via Foo(khaz,mo), Foo(zul,jin)", () => {
                let cache = new QueryCache();

                let byKhazMo = new Query.ByKeys({
                    entityType: Foo,
                    keys: ["khaz", "mo"]
                });

                let byZulJin = new Query.ByKeys({
                    entityType: Foo,
                    keys: ["zul", "jin"]
                });

                let byMoZul = new Query.ByKeys({
                    entityType: Foo,
                    keys: ["mo", "zul"]
                });

                cache.add(byKhazMo);
                cache.add(byZulJin);

                expect(cache.isCached(byMoZul)).toBe(true);
            });
        });

        describe("w/ expansions", () => {
            @Entity() class Foo {
                @Entity.PrimaryKey() id: string;
                @Entity.Children({ back: "parent", other: () => Bar }) children: Bar[];
            }

            @Entity() class Bar {
                @Entity.PrimaryKey() id: string;
                @Entity.Reference({ key: "parentId", other: () => Foo }) parent: Foo;
            }

            it("Foo(mo)/children should be cached via Foo(khaz,mo,dan)/children", () => {
                let cache = new QueryCache();

                let byKeys = new Query.ByKeys({
                    entityType: Foo,
                    keys: ["khaz", "mo", "dan"],
                    expansions: `children`
                });

                let byMo = new Query.ByKey({
                    entityType: Foo,
                    key: "mo",
                    expansions: `children`
                });

                cache.add(byKeys);

                expect(cache.isCached(byMo)).toBe(true);
            });
        });
    });
});
