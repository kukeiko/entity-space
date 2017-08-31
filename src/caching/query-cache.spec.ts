import { EntityClass, Property } from "../metadata";
import { Query } from "../elements";
import { QueryCache } from "./query-cache";

describe("query-cache", () => {
    describe("isCached()", () => {
        describe("identity only", () => {
            @EntityClass() class Foo { @Property.Id() id: string; }

            it("Foo(mo) should be cached via Foo(khaz,mo,dan)", () => {
                let cache = new QueryCache();

                let byKeys = Query.ByIds({
                    ids: ["khaz", "mo", "dan"],
                    entity: Foo
                });

                let byMo = Query.ByIds({
                    ids: ["mo"],
                    entity: Foo
                });

                cache.merge(byKeys);

                expect(cache.isCached(byMo)).toBe(true);
            });

            it("Foo(khaz,mo,dan) should be cached via Foo(mo), Foo(dan), Foo(khaz)", () => {
                let cache = new QueryCache();

                let byMo = Query.ByIds({
                    ids: ["mo"],
                    entity: Foo
                });

                let byDan = Query.ByIds({
                    ids: ["dan"],
                    entity: Foo
                });

                let byKhaz = Query.ByIds({
                    ids: ["khaz"],
                    entity: Foo
                });

                let byKeys = Query.ByIds({
                    ids: ["khaz", "mo", "dan"],
                    entity: Foo
                });

                cache.merge(byMo);
                cache.merge(byDan);
                cache.merge(byKhaz);

                expect(cache.isCached(byKeys)).toBe(true);
            });

            it("Foo(khaz,zul) should be cached via Foo(khaz,mo), Foo(zul,jin)", () => {
                let cache = new QueryCache();

                let byKhazMo = Query.ByIds({
                    ids: ["khaz", "mo"],
                    entity: Foo
                });

                let byZulJin = Query.ByIds({
                    ids: ["zul", "jin"],
                    entity: Foo
                });

                let byKhazZul = Query.ByIds({
                    ids: ["khaz", "zul"],
                    entity: Foo
                });

                cache.merge(byKhazMo);
                cache.merge(byZulJin);

                expect(cache.isCached(byKhazZul)).toBe(true);
            });
        });

        describe("w/ expansions", () => {
            @EntityClass() class Foo {
                @Property.Id() id: string;
                @Property.Children({ back: "parent", other: () => Bar }) children: Bar[];
            }

            @EntityClass() class Bar {
                @Property.Id() id: string;
                @Property.Reference({ key: "parentId", other: () => Foo }) parent: Foo;
            }

            it("Foo(mo)/children should be cached via Foo(khaz,mo,dan)/children", () => {
                let cache = new QueryCache();

                let byKeys = Query.ByIds({
                    ids: ["khaz", "mo", "dan"],
                    entity: Foo,
                    expand: `children`
                });

                let byMo = Query.ByIds({
                    ids: ["mo"],
                    entity: Foo,
                    expand: `children`
                });

                cache.merge(byKeys);

                expect(cache.isCached(byMo)).toBe(true);
            });
        });
    });
});
