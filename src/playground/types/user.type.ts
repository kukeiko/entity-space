import { Type, Property, DomainBuilder } from "@sandbox";
import { MetadataMixin } from "./metadata.mixin";
import { UserTypeType } from "./user-type.type";

export interface UserType extends Type<"user">, MetadataMixin {
    id: Property.Id.Computed<"id", typeof String, UserType, "userId" | "systemId">;
    userId: Property.Primitive<"userId", typeof Number, "u", "UserId">;
    name: Property.Primitive<"name", typeof String, never, "Name">;

    parentId: Property.Reference.Id.Computed<"parentId", UserType, "id", UserType, "parentUserId" | "systemId">;
    parentUserId: Property.Primitive<"parentUserId", typeof Number, "n", "ParentId">;
    parent: Property.Reference.Virtual<"parent", UserType, UserType["parentId"]>;

    typeId: Property.Reference.Id<"typeId", UserTypeType, "id">;
    type: Property.Reference<"type", UserTypeType, UserType["typeId"]>;

    level: Property.Primitive<"level", typeof Number, never, "Level", typeof String>;
    achievements: Property.Primitive.Array<"achievements", typeof Number, never, "Achievements">;
    numAchievements: Property.Primitive.Computed<"numAchievements", typeof Number, UserType, "achievements">;
    randomInts: Property.Primitive.Array<"randomInts", typeof Number, never, "RandomInts", typeof String>;
    languages: Property.Primitive.Array.Deserialized<"languages", typeof String, "n", "Languages", typeof String>;
}

export module UserType {
    export function getDefinition(): DomainBuilder.DefineArguments<UserType> {
        return {
            $: {
                key: "user"
            },
            ...MetadataMixin.getDefinition(),
            achievements: {
                dtoKey: "Achievements",
                type: "primitive:array"
            },
            id: {
                type: "id:computed",
                computedFrom: {
                    systemId: true,
                    userId: true
                },
                compute: x => `${x.userId}:${x.systemId}`
            },
            languages: {
                type: "primitive:array:deserialized",
                dtoKey: "Languages",
                flags: {
                    n: true
                },
                fromDto: x => x.split(","),
                toDto: x => x.join(",")
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
                compute: x => x.achievements.length
            },
            parent: {
                flags: {
                    n: true
                }
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
                toDto: x => x.map(int => int.toString())
            },
            type: {
                localIdKey: "typeId",
                // flags: {
                //     n: true
                // }
            },
            typeId: {
                otherIdKey: "id",
                otherKey: "user-type",
                // flags: {
                //     n: true
                // }
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
