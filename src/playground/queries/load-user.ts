import { Query, Instance } from "@sandbox";
import { UserType } from "../types";

let userType: UserType = {} as any;

let query = new Query(userType)
    .select(x => x.changedById, [f => f.equals("foo")])
    .select(x => x.changedByUserId)
    .select(x => x.createdById)
    .select(x => x.createdBy, q => q.select(x => x.name))
    .select(x => x.parent, q => q.select(x => x.name).select(x => x.parent, q => q.select(x => x.name)))
    .select(x => x.achievements, [[f => f.intersects([1])]])
    .select(x => x.level, [
        f => f.group("under lvl 7 and type in (1, 3)").to(7, false),
        f => f.group("under lvl 13 and type in (1)").to(13, false)
    ])
    .select(x => x.typeId, [
        f => f.group("under lvl 7 and type in (1, 3)").in([1, 3]),
        f => f.group("under lvl 13 and type in (1)").in([1])
    ])
    ;

let type = query.get();

let instanceA: Instance<typeof type> = {
    createdById: "foo",
    changedById: null,
    createdBy: null,
    parent: {
        name: "bar",
        parent: null
    },
    achievements: [1, 2, 3],
    changedByUserId: 1337,
    level: 3,
    typeId: 3
};

let instanceB: Instance<typeof type> = {
    createdById: "foo",
    changedById: null,
    createdBy: {
        name: "susi"
    },
    parent: {
        name: "koarli",
        parent: {
            name: "tyrande"
        }
    },
    achievements: [1, 2, 4],
    changedByUserId: 8,
    level: 12,
    typeId: 1
};

let dto: Instance.Dto<typeof type> = {
    Achievements: [67, 34],
    ChangedByUserId: 3,
    Level: "3",
    typeId: 8
};
