import { Query, Instance } from "@sandbox";
import { UserType } from "../types";

let userType: UserType = {} as any;

let query = new Query(userType)
    .select(x => x.changedById)
    .select(x => x.createdById)
    .select(x => x.createdBy, q => q.select(x => x.name))
    .select(x => x.parent, q => q.select(x => x.name).select(x => x.parent, q => q.select(x => x.name)))
    ;

let type = query.get();

let instanceA: Instance<typeof type> = {
    createdById: "foo",
    changedById: null,
    createdBy: null,
    parent: {
        name: "bar",
        parent: null
    }
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
    }
};

let dto: Instance.Dto<typeof type> = {

};
