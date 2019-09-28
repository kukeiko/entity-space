import { Type, Property, DomainBuilder } from "@sandbox";
import { MetadataMixin } from "./metadata.mixin";
import { UserTypeType } from "./user-type.type";
import { LoadBalancedMixin } from "./load-balanced.mixin";
import { KeyValuePairType } from "./key-value-pair.type";

export interface UserType extends Type<"user">, MetadataMixin, LoadBalancedMixin {
    id: Property.Id.Computed<"id", typeof String, UserType, "userId" | "systemId">;
    userId: Property.Primitive<"userId", typeof Number, "u", "UserId">;
    name: Property.Primitive<"name", typeof String, never, "Name">;

    parentId: Property.Reference.Id.Computed<"parentId", UserType, "id", UserType, "parentUserId" | "systemId">;
    parentUserId: Property.Primitive<"parentUserId", typeof Number, "n", "ParentId">;
    /**
     * [todo]
     * parent isn't really virtual, since the actual http request will support it.
     * so even if the id is computed out of parentId & systemId, it *should* be fine.
     */
    parent: Property.Reference<"parent", UserType, UserType["parentId"], "n", "Parent">;
    // parent: Property.Reference.Virtual<"parent", UserType, UserType["parentId"]>;

    typeId: Property.Reference.Id<"typeId", UserTypeType, "id", "c", "TypeId">;
    type: Property.Reference<"type", UserTypeType, UserType["typeId"]>;

    level: Property.Primitive<"level", typeof Number, never, "Level", typeof String>;
    achievements: Property.Primitive.Array<"achievements", typeof Number, never, "Achievements">;
    numAchievements: Property.Primitive.Computed<"numAchievements", typeof Number, UserType, "achievements">;
    randomInts: Property.Primitive.Array<"randomInts", typeof Number, never, "RandomInts", typeof String>;
    languages: Property.Primitive.Array.Deserialized<"languages", typeof String, "n", "Languages", typeof String>;

    property: Property.Complex<"property", KeyValuePairType, "n" | "c" | "p", "Property">;
    properties: Property.Complex.Array<"properties", KeyValuePairType, "n" | "c" | "p", "Properties">;
}

let foo: UserType = null as any;

export module UserType {
    export function getDefinition(): DomainBuilder.DefineArguments<UserType> {
        return {
            $: {
                key: "user"
            },
            ...MetadataMixin.getDefinition(),
            ...LoadBalancedMixin.getDefinition(),
            achievements: {
                dtoKey: "Achievements",
                type: "primitive:array",
                primitive: Number
            },
            id: {
                type: "id:computed",
                computedFrom: {
                    systemId: true,
                    userId: true
                },
                compute: x => `${x.userId}:${x.systemId}`,
                primitive: String
            },
            property: {
                type: "complex",
                otherTypeKey: "key-value-pair",
                dtoKey: "Property",
                flags: {
                    c: true,
                    n: true,
                    p: true
                }
            },
            properties: {
                dtoKey: "Properties",
                flags: {
                    c: true,
                    n: true,
                    p: true
                },
                otherTypeKey: "key-value-pair",
                type: "complex:array"
            },
            languages: {
                type: "primitive:array:deserialized",
                dtoKey: "Languages",
                flags: {
                    n: true
                },
                fromDto: x => x.split(","),
                toDto: x => x.join(","),
                primitive: String
            },
            level: {
                type: "primitive",
                primitive: Number,
                dtoKey: "Level",
                fromDto: x => parseInt(x),
                toDto: x => x.toString()
            },
            name: {
                type: "primitive",
                primitive: String,
                dtoKey: "Name"
            },
            numAchievements: {
                type: "primitive:computed",
                computedFrom: {
                    achievements: true
                },
                compute: x => x.achievements.length,
                primitive: Number
            },
            parent: {
                dtoKey: "Parent",
                flags: {
                    n: true
                },
                localKey: "parentId",
                otherTypeKey: "user",
                type: "reference"
            },
            parentId: {
                flags: {
                    n: true
                }
            },
            parentUserId: {
                type: "primitive",
                primitive: Number,
                dtoKey: "ParentId",
                flags: {
                    n: true
                }
            },
            randomInts: {
                type: "primitive:array",
                dtoKey: "RandomInts",
                // flags: {
                //     n: true
                // },
                fromDto: x => x.map(str => parseInt(str)),
                toDto: x => x.map(int => int.toString()),
                primitive: Number
            },
            type: {
                localKey: "typeId",
                otherTypeKey: "user-type",
                type: "reference"
            },
            typeId: {
                dtoKey: "TypeId",
                flags: { c: true },
                otherIdKey: "id",
                otherTypeKey: "user-type",
                primitive: Number,
                type: "reference:id"
            },
            userId: {
                type: "primitive",
                primitive: Number,
                dtoKey: "UserId",
                flags: {
                    u: true
                }
            }
        };
    }
}
