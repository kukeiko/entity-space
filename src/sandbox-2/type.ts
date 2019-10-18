import { PropertyComponent } from "./component/property.component";
import { Property } from "./property";

export const $Type: unique symbol = Symbol();

export type Type<T extends Object = Object>
    = Type.PropertyDeclarations<T>
    & Type.MetadataDeclaration;

export module Type {
    export type PropertyDeclarations<T extends object = object>
        = Record<Exclude<keyof T, typeof MetadataDeclaration.Key>, Property>;

    export interface Metadata<K extends string = string> {
        id: K;
    }

    export type MetadataDeclaration<K extends string = string> = {
        [MetadataDeclaration.Key]: { id: K; };
    };

    export module MetadataDeclaration {
        export const Key: unique symbol = Symbol();
    }

    export type Id<T extends MetadataDeclaration> = T[typeof MetadataDeclaration.Key]["id"];
}

export interface KeyValueType {
    [Type.MetadataDeclaration.Key]: { id: "key-value-pair"; };
    key: Property.Primitive<"key", typeof String, "n">;
    value: Property.Primitive<"value", typeof String>;
}

let kvpType: KeyValueType = {
    [Type.MetadataDeclaration.Key]: { id: "key-value-pair" },
    key: {
        creatable: false,
        name: "key",
        nullable: true,
        patchable: false,
        primitive: String,
        read: x => x.key,
        type: "primitive",
        unique: false
    },
    value: {
        creatable: false,
        name: "value",
        nullable: false,
        patchable: false,
        primitive: String,
        read: x => x.value,
        type: "primitive",
        unique: false
    }
};

export interface UserType {
    [Type.MetadataDeclaration.Key]: { id: "user"; };
    id: Property.Id<"id", typeof Number>;
    name: Property.Primitive<"value", typeof String>;
}

let userType: UserType = {
    [Type.MetadataDeclaration.Key]: { id: "user" },
    id: {
        creatable: false,
        name: "id",
        nullable: false,
        patchable: false,
        primitive: Number,
        read: x => x.id,
        type: "id",
        unique: false,
        larifari: "foo"
    },
    name: {
        creatable: false,
        name: "value",
        nullable: false,
        patchable: false,
        primitive: String,
        read: x => x.value,
        type: "primitive",
        unique: false
    }
};

function takesTypeWithAny<T extends Type<T>>(type: T): T {
    for (let k in type) {
        let property = type[k];

        switch (property.type) {
            case "id":
                /**
                 * [note] i stopped with this approach since discrimation didn't work as
                 * i expected it to.
                 */
                // property.larifari;
                break;

            case "primitive":
                break;
        }

        console.log(property.name.charAt(2));
        console.log(property.nullable === true);

        property.read({ lala: 3 });
    }

    return type;
}

takesTypeWithAny(kvpType).key.read({ key: "foo" });
takesTypeWithAny(kvpType).value.read({ value: "bar" }).indexOf("bar");
takesTypeWithAny(userType).id.read({ id: 1337 }).toFixed(2);
