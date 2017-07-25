import { Entity, getEntityMetadata, ValueType } from "../metadata";
import { Expansion } from "../elements";
import { EntityMapper } from "./entity-mapper";

describe("entity-mapper", () => {
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
        @Entity.PrimaryKey({ alias: "Id" }) id: number = null;
        @Entity.Primitive({ alias: "A" }) a: string = null;
        @Entity.Primitive({ alias: "B", valueType: ValueType.Date }) b: Date = null;
        @Entity.Primitive({ alias: "C", valueType: ValueType.Object }) c: Object = null;

        @Entity.ReferenceKey({ alias: "FooNr" }) fooId: number = null;
        @Entity.Reference({ alias: "Foo", key: "fooId", other: () => Foo }) foo: Foo = null;

        @Entity.ReferenceKey({ alias: "BazNr" }) bazId: number = null;
        @Entity.Reference({ alias: "Baz", key: "bazId", other: () => Baz }) baz: Baz = null;
    }

    @Entity() class Baz {
        constructor(args?: Partial<Baz>) { Object.assign(this, args || {}); };
        @Entity.PrimaryKey() id: number = null;
        @Entity.Primitive() a: string = null;
        @Entity.Primitive() b: Date = null;
        @Entity.Primitive() c: Object = null;
    }

    // fit("dto => cachable", () => {
    //     let mapper = new EntityMapper();

    //     let barDto = {
    //         Id: 8,
    //         A: "a-string",
    //         B: new Date(),
    //         C: { one: { more: 3, time: [0, 1, 2] } },
    //         FooNr: 64,
    //         BazNr: 32
    //     };

    //     let cacheable = mapper.dtosToEntities({
    //         dtos: [barDto],
    //         metadata: Bar
    //     })[0] || null;

    //     expect(cacheable.id).toBe(barDto.Id);
    //     expect(cacheable.a).toBe(barDto.A);
    //     expect(cacheable.b).not.toBe(barDto.B);
    //     expect(cacheable.b).toEqual(barDto.B);
    //     expect(cacheable.c).not.toBe(barDto.C);
    //     expect(cacheable.c).toEqual(barDto.C);
    //     expect(cacheable.fooId).toBe(barDto.FooNr);
    //     expect(cacheable.bazId).toBe(barDto.BazNr);
    // });

    it("should map x entities under y ms", () => {
        let mapper = new EntityMapper();
        let foos: Foo[] = [];
        let numRootEntities = 1000;

        for (let i = 0; i < numRootEntities; ++i) {
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

        let times = 3;
        // let start = Date.now();

        console.time("mapping");
        for (let i = 0; i < times; ++i) {

            foos.map(f => mapper.createEntity({
                from: f,
                entityType: Foo,
                expansions: Expansion.parse(Foo, `bars/baz`)
            }));
        }
        console.timeEnd("mapping");
        // let raw = Date.now() - start;
        // let start2 = Date.now();

        // window["use-compile"] = true;

        // console.time("mapping (compiled)");
        // for (let i = 0; i < times; ++i) {

        //     foos.map(f => mapper.createEntity({
        //         from: f,
        //         entityType: Foo,
        //         expansions: Expansion.parse(Foo, `bars/baz`)
        //     }));
        // }
        // console.timeEnd("mapping (compiled)");
        // let compiled = Date.now() - start2;

        // console.log(`${((compiled / raw) * 100).toFixed(2)} %`);
    });
});
