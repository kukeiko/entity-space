import { Property } from "./property";
import { Instance } from "./instance";
import { PropertyComponent } from "./component/property.component";

export interface Type {
    properties: Record<string, Property>;
    // properties: Partial<Record<string, Property>>;
}

export interface NamedType extends Type {
    name: string;
}

export interface KeyValueType extends NamedType {
    name: "key-value-pair";
    properties: {
        key: Property.String<"key", "n">;
        value: Property.String<"value">;
    };
}

let kvpType: KeyValueType = {
    name: "key-value-pair",
    properties: {
        key: {
            creatable: false,
            name: "key",
            nullable: true,
            patchable: false,
            primitive: String,
            read: x => x.key,
            type: "string",
            unique: false
        },
        value: {
            creatable: false,
            name: "value",
            nullable: false,
            patchable: false,
            primitive: String,
            read: x => x.value,
            type: "string",
            unique: false
        }
    }
};

export interface UserTypeType extends NamedType {
    name: "user-type";
    properties: {
        id: Property.Id<"id", typeof Number>;
        name: Property.Primitive<"name", typeof String>;
    };
}

export interface UserType extends NamedType {
    name: "user";
    properties: {
        id: Property.Id<"id", typeof Number, "c">;
        level: Property.Number<"level", "c" | "p">
        name: Property.Primitive<"name", typeof String>;
        type: Property.Reference<"type", UserTypeType>;
    };
}

let userType: UserType = {
    name: "user",
    properties: {
        id: {
            creatable: true,
            name: "id",
            nullable: false,
            patchable: false,
            primitive: Number,
            read: x => x.id,
            type: "id",
            unique: true,
            larifari: "foo"
        },
        level: {
            creatable: true,
            name: "level",
            nullable: false,
            patchable: true,
            primitive: Number,
            read: x => x.level,
            type: "number",
            unique: false
        },
        name: {
            creatable: false,
            name: "name",
            nullable: false,
            patchable: false,
            primitive: String,
            read: x => x.name,
            type: "primitive",
            unique: false
        },
        type: {
            creatable: false,
            name: "type",
            nullable: false,
            patchable: false,
            read: x => x.type,
            referenced: null as any,
            type: "reference",
            unique: false
        }
    }
};

function defineKeyValuePairType(tb: TypeBuilder): TypeBuilder<KeyValueType> {
    return tb
        .named("key-value-pair")
        .addString("key", ["n"])
        .addString("value")
        ;
}

function takesTypeWithAny<T extends NamedType>(type: T): T {
    for (let k in type.properties) {
        let property = type.properties[k];
        // if (property === void 0) continue;

        switch (property.type) {
            case "id":
                property.larifari;
                break;

            case "primitive":

                break;

            case "reference":
                property.referenced().properties;
                break;
        }

        console.log(property.name.charAt(2));
        console.log(property.nullable === true);

        property.read({ lala: 3 });
    }

    return type;
}

takesTypeWithAny(kvpType).properties.key.read({ key: "foo" });
takesTypeWithAny(kvpType).properties.value.read({ value: "bar" }).indexOf("bar");
takesTypeWithAny(userType).properties.id.read({ id: 1337 }).toFixed(2);
userType.properties.name.read({ name: "3" });

let userInstance: Instance<UserType> = {
    id: 64,
    level: 64,
    name: "Susi",
    type: {
        id: 17,
        name: "Admin"
    }
};

class Domain<D extends Record<string, Type> = {}> {
    declare<K extends string>(name: K): Domain<D & Record<K, Type>> {
        return this as any;
    }

    define_<K extends keyof D, O extends Type = Type>(name: K, builder: (domain: this, tb: TypeBuilder) => TypeBuilder<O>)
        : Domain<D & Record<K, O>> {
        return this as any;
    }

    define<K extends string, O extends Type = Type>(name: K, builder: (domain: this, tb: TypeBuilder) => TypeBuilder<O>)
        : Domain<D & Record<K, O>> {
        return this as any;
    }

    getTypes(): D {
        return {} as any;
    }

    getType<K extends keyof D>(k: K): D[K] {
        return {} as any;
    }
}

let domain = new Domain()
    .declare("parent")
    .declare("child")
    ;

let domainTypes = new Domain()
    .define("child", (domain, tb) => tb
        .addNumber("age")
    )
    .define("parent", (domain, tb) => tb
        .addString("name")
        .addReference("child", () => domain.getType("child"))
    )
    .define("child", (domain, tb) => tb
        .addReference("parent", () => domain.getType("parent"))
    )
    // .define("parent", (domain, tb) => tb
    //     .addReference("child", () => domain.getType("child"))
    // )

    // .getType("child").properties.parent.referenced().properties.child.referenced().properties.
    .getTypes();

domainTypes.child.properties.parent.referenced().properties.child.referenced().properties.age.read({ age: 64 }).toFixed(2);

let cmsDomain = new Domain()
    .define("widget-template-parameter", (domain, builder) => builder
        .addString("key")
    )
    .define("widget-parameter", (domain, builder) => builder
        .addString("value")
    );

class TypeBuilder<T extends Type = { properties: {}; }> {
    named<K extends string>(name: K): TypeBuilder<T & { name: K }> {
        return this as any;
    }

    addNumber<K extends string, F extends PropertyComponent.Flags = never>(key: K, flags: F[] = [])
        : TypeBuilder<T & { properties: Record<K, Property.Number<K, F>> }> {
        return this as any;
    }

    addString<K extends string, F extends PropertyComponent.Flags = never>(key: K, flags: F[] = [])
        : TypeBuilder<T & { properties: Record<K, Property.String<K, F>> }> {
        return this as any;
    }

    addReference<K extends string, V extends Type>(key: K, type: () => V)
        : TypeBuilder<T & { properties: Record<K, Property.Reference<K, V>> }> {
        return this as any;
    }

    add2<K extends string, V extends Property.Primitive.ValueType, F extends PropertyComponent.Flags = never>(key: K, valueType: V, flags: F[] = [])
        : TypeBuilder<T & { properties: Record<K, Property.Primitive<K, V, F>> }> {
        return this as any;
    }

    add<K extends string, V extends Property.Primitive.ValueType, F extends PropertyComponent.Flags = never>(property: Property.Primitive<K, V, F>)
        : TypeBuilder<T & { properties: Record<K, Property.Primitive<K, V, F>> }> {
        return this as any;
    }

    build(): T {
        return {} as any;
    }
}

let typeBuilder = new TypeBuilder();

// let builtType = typeBuilder.add<"foo", typeof String, "n" | "p" | "u">({
//     creatable: false,
//     name: "foo",
//     nullable: true,
//     patchable: true,
//     primitive: String,
//     read: x => x.foo,
//     type: "primitive",
//     unique: true
// }).build();

let builtType = typeBuilder
    .addNumber("level")
    .addString("name")
    .add2("foo", String).build();

builtType.properties.name.read({ name: "Susi" });
builtType.properties.foo.read({ foo: "foo" });
