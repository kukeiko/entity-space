import { Query, Instance } from "../sandbox";
import { CountryType } from "./types";

let countryType: CountryType = {} as any;

let query = new Query(countryType)
    .select(x => x.changedById)
    .select(x => x.createdById)
    .select(x => x.languages, [[f => f.intersects("en")]])
    ;

let type = query.get();

let instance: Instance<typeof type> = {
    createdById: "foo",
    changedById: null,
    languages: ["en", "de"]
};

let dto: Instance.Dto<typeof type> = {
    Languages: "en,de"
};
