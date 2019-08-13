// import { Query, Instance, Component } from "../sandbox";
// import { ArtistType } from "../user";

// let artistQuery = new Query<ArtistType>()
//     .select(x => x.countryId)
//     .select(x => x.reviewIds, [[f => f.intersectsWith([1, 2, 3])]])
//     .select(x => x.albums, q => q.select(x => x.id))
//     .select(x => x.parentId)
//     .select(x => x.systemId)
//     ;

// let artist: Instance<ReturnType<typeof artistQuery["get"]>> = {
//     albums: [],
//     countryId: Math.random() > .5 ? "foo" : null,
//     parentId: "foo",
//     reviewIds: [1, 2, 3],
//     systemId: Math.random() > .5 ? "foo" : null,
// };

// let artistDto: Instance.Dto<ReturnType<typeof artistQuery["get"]>> = {
//     Albums: [],
//     CountryId: Math.random() > .5 ? "foo" : null,
//     ReviewIds: [1, 2, 3]
// };
