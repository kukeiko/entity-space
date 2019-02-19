import { Query, Instance } from "../sandbox";
import { CountryType } from "../user";

let query = new Query<CountryType>()
    .select(x => x.changedById)
    .select(x => x.createdById)
    ;

let type = query.get();

let instance: Instance<typeof type> = {
    createdById: "foo",
    changedById: null
};
