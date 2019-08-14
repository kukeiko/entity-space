import { Domain } from "@sandbox";
import { UserType, SystemType } from "../types";

let domain = new Domain();

domain.define<SystemType>("system", {
    id: {
        dtoKey: "Id",
        fromDto: x => parseInt(x),
        toDto: x => x.toString()
    },
    name: {

    }
});


domain.define<UserType>("user", {
    changedAt: {
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
        flags: {
            n: true
        }
    },
    changedByUserId: {
        dtoKey: "ChangedById",
        flags: {
            n: true
        }
    },
    createdAt: {
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
        flags: {
            n: true
        }
    },
    createdByUserId: {
        dtoKey: "CreatedById"
    },
    id: {
        flags: {
            u: true
        }
    },
    languages: {
        dtoKey: "Languages",
        flags: {
            n: true
        },
        fromDto: x => x.split(","),
        toDto: x => x.join(",")
    },
    level: {
        dtoKey: "Level",
        fromDto: x => parseInt(x),
        toDto: x => x.toString()
    },
    name: {
        dtoKey: "Name"
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
        dtoKey: "ParentId",
        flags: {
            n: true
        }
    },
    randomInts: {
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
        dtoKey: "UserId",
        flags: {
            u: true
        }
    }
});
