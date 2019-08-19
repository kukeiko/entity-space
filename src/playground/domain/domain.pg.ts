import { Domain } from "@sandbox";
import { UserType, SystemType } from "../types";

let domain = new Domain();

domain.define<SystemType>("system", {
    id: {
        type: "id",
        dtoKey: "Id",
        fromDto: x => parseInt(x),
        toDto: x => x.toString()
    },
    name: {
        type: "primitive",
        primitive: String
    }
});

domain.define<UserType>("user", {
    achievements: {
        dtoKey: "Achievements",
        type: "primitive:array"
    },
    changedAt: {
        type: "primitive",
        primitive: String,
        dtoKey: "ChangedAt",
        flags: {
            n: true
        }
    },
    changedBy: {
        flags: {
            n: true
        }
    },
    changedById: {
        flags: {
            n: true
        }
    },
    changedBySystemId: {
        type: "primitive:ethereal",
        flags: {
            n: true
        }
    },
    changedByUserId: {
        type: "primitive",
        primitive: Number,
        dtoKey: "ChangedById",
        flags: {
            n: true
        }
    },
    createdAt: {
        type: "primitive",
        primitive: String,
        dtoKey: "CreatedAt"
    },
    createdBy: {
        flags: {
            n: true
        }
    },
    createdById: {
        flags: {
            n: true
        }
    },
    createdBySystemId: {
        type: "primitive:ethereal"
    },
    createdByUserId: {
        type: "primitive",
        primitive: Number,
        dtoKey: "CreatedById"
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
    system: {
        flags: {
            n: true
        }
    },
    systemId: {
        flags: {
            n: true
        }
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
});
