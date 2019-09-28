import { DomainBuilder, Type, Property } from "@sandbox";

describe("domain-builder", () => {
    it("should construct an empty type", () => {
        /**
         * [arrange]
         */
        interface SampleType extends Type<"sample"> { }
        let domainBuilder = new DomainBuilder();

        /**
         * [act]
         */
        let domain = domainBuilder.define<SampleType>({
            $: {
                key: "sample"
            }
        }).build();

        /**
         * [assert]
         */
        let sampleType = domain.getType("sample");
        expect(sampleType == null).toBe(false);
        expect(sampleType.$ == null).toBe(false);
        expect(sampleType.$.key).toBe("sample");
    });

    it("should construct a primitive property of a type (with minimal arguments)", () => {
        /**
         * [arrange]
         */
        interface SampleType extends Type<"sample"> {
            name: Property.Primitive<"name", typeof String>;
        }

        let domainBuilder = new DomainBuilder();

        /**
         * [act]
         */
        let domain = domainBuilder.define<SampleType>({
            $: {
                key: "sample"
            },
            name: {
                primitive: String,
                type: "primitive"
            }
        }).build();

        /**
         * [assert]
         */
        let sampleType = domain.getType("sample");
        expect(sampleType == null).toBe(false);

        let nameProp = domain.getType("sample").name;
        expect(nameProp == null).toBe(false);
        expect(nameProp.array).toBe(false);
        expect(nameProp.dtoKey).toBe("name");
        expect(nameProp.fromDto("foo")).toBe("foo");
        expect(nameProp.key).toBe("name");
        expect(nameProp.local).toBe(true);
        expect(nameProp.modifiers).toEqual({});
        expect(nameProp.primitive).toBe(String);
        expect(nameProp.read({ name: "foo" })).toBe("foo");
        expect(nameProp.readDto({ name: "foo" })).toBe("foo");
        expect(nameProp.toDto("foo")).toBe("foo");
        expect(nameProp.type).toBe("primitive");

        let writeSample = { name: "foo" };
        nameProp.write(writeSample, "bar");
        expect(writeSample.name).toBe("bar");

        let writeDtoSample = { name: "foo" };
        nameProp.writeDto(writeDtoSample, "bar");
        expect(writeDtoSample.name).toBe("bar");
    });

    it("should construct a primitive property of a type (with all arguments)", () => {
        /**
         * [arrange]
         */
        interface SampleType extends Type<"sample"> {
            level: Property.Primitive<"level", typeof Number, "c" | "n" | "p" | "u", "Level", typeof String>;
        }

        let domainBuilder = new DomainBuilder();

        /**
         * [act]
         */
        let domain = domainBuilder.define<SampleType>({
            $: {
                key: "sample"
            },
            level: {
                dtoKey: "Level",
                flags: {
                    c: true,
                    n: true,
                    p: true,
                    u: true
                },
                fromDto: x => +x,
                primitive: Number,
                toDto: x => x.toString(),
                type: "primitive"
            }
        }).build();

        /**
         * [assert]
         */
        let sampleType = domain.getType("sample");
        expect(sampleType == null).toBe(false);

        let levelProp = domain.getType("sample").level;
        expect(levelProp == null).toBe(false);
        expect(levelProp.array).toBe(false);
        expect(levelProp.dtoKey).toBe("Level");
        expect(levelProp.fromDto("1")).toBe(1);
        expect(levelProp.key).toBe("level");
        expect(levelProp.local).toBe(true);
        expect(levelProp.modifiers).toEqual({ c: true, n: true, p: true, u: true });
        expect(levelProp.primitive).toBe(Number);
        expect(levelProp.read({ level: 1 })).toBe(1);
        expect(levelProp.readDto({ Level: "1" })).toBe("1");
        expect(levelProp.toDto(1)).toBe("1");
        expect(levelProp.type).toBe("primitive");

        let writeSample = { level: 1 };
        levelProp.write(writeSample, 2);
        expect(writeSample.level).toBe(2);

        let writeDtoSample = { Level: "1" };
        levelProp.writeDto(writeDtoSample, "2");
        expect(writeDtoSample.Level).toBe("2");
    });
});
