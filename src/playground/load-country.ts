import { Query, Instance } from "@sandbox";
import { CountryType } from "./types";

let countryType: CountryType = {} as any;

let query = new Query(countryType)
    .select(x => x.changedById)
    .select(x => x.createdById)
    .select(x => x.createdBy, q => q.select(x => x.name))
    .select(x => x.languages, [[f => f.intersects("en")]])
    ;

let type = query.get();

let instanceA: Instance<typeof type> = {
    createdById: "foo",
    changedById: null,
    createdBy: null,
    languages: ["en", "de"]
};

let instanceB : Instance<typeof type> = {
    createdById: "foo",
    changedById: null,
    createdBy: {
        name: "susi"
    },
    languages: ["en", "de"]
};

let dto: Instance.Dto<typeof type> = {
    Languages: "en,de"
};
