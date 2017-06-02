import { Entity, getEntityMetadata } from "./metadata";
import { Expansion } from "./elements";
import { EntityMapper } from "./entity-mapper";

fdescribe("entity-mapper", () => {
    @Entity() class Foo {
        constructor(args?: Partial<Foo>) { Object.assign(this, args || {}); };
        @Entity.PrimaryKey() id: number = null;
        @Entity.Primitive() a: string = null;
        @Entity.Primitive() b: Date = null;
        @Entity.Primitive() c: Object = null;

        @Entity.Children({ back: "foo", other: () => Bar }) bars: Bar[] = [];
    }

    @Entity() class Bar {
        constructor(args?: Partial<Bar>) { Object.assign(this, args || {}); };
        @Entity.PrimaryKey() id: number = null;
        @Entity.Primitive() a: string = null;
        @Entity.Primitive() b: Date = null;
        @Entity.Primitive() c: Object = null;

        @Entity.ReferenceKey() fooId: number = null;
        @Entity.Reference({ key: "fooId", other: () => Foo }) foo: Foo = null;

        @Entity.ReferenceKey() bazId: number = null;
        @Entity.Reference({ key: "bazId", other: () => Baz }) baz: Baz = null;
    }

    @Entity() class Baz {
        constructor(args?: Partial<Baz>) { Object.assign(this, args || {}); };
        @Entity.PrimaryKey() id: number = null;
        @Entity.Primitive() a: string = null;
        @Entity.Primitive() b: Date = null;
        @Entity.Primitive() c: Object = null;
    }

    let mapper = new EntityMapper();

    let compiled = mapper.compileCopyPrimitives({
        fromDto: false,
        includeComputed: false,
        metadata: getEntityMetadata(Foo),
        predicate: null,
        toDto: false
    });

    // console.log(compiled);
    eval.call(null, compiled);

    it("should map x entities under y ms", () => {
        let mapper = new EntityMapper();
        let foos: Foo[] = [];

        for (let i = 0; i < 1000; ++i) {
            let foo = new Foo({
                id: i,
                a: "a".repeat(20),
                b: new Date(),
                c: { foo: 1, bar: true, baz: [1, 2, 3] }
            });

            for (let e = 0; e < 10; ++e) {
                foo.bars.push(new Bar({
                    id: i,
                    a: "a".repeat(20),
                    b: new Date(),
                    c: { foo: 20, bar: { yes: "no" }, baz: ["1", "2", "3"] },
                    fooId: foo.id,
                    baz: new Baz({
                        id: i,
                        a: "a".repeat(20),
                        b: new Date(),
                        c: { foo: 20, bar: { yes: "no" }, baz: ["1", "2", "3"] }
                    })
                }));
            }

            foos.push(foo);
        }

        console.time("mapping");

        foos.map(f => mapper.createEntity({
            from: f,
            entityType: Foo,
            expansions: Expansion.parse(Foo, `bars/baz`)
        }));

        console.timeEnd("mapping");
    });
});
