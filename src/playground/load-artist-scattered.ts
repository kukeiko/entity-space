import { Query, Instance } from "../sandbox";
import { ArtistType } from "../user";
import { selectArtistDefaults } from "./select-artist-defaults";
import { selectAlbumDefaults } from "./select-album-defaults";

let artistQuery = new Query<ArtistType>()
    .apply(selectArtistDefaults)
    .select(x => x.albums, q => q.apply(selectAlbumDefaults))
    ;

let queriedArtistType = artistQuery.get();
queriedArtistType.albums.selected.artistId.dtoKey = "ArtistId";

// let artist : Instance<ReturnType<typeof artistQuery["get"]>> = {

// };

let artistDto: Instance.Dto<ReturnType<typeof artistQuery["get"]>> = {
    Albums: [],
    ChangedAt: "2019",
    ChangedById: 3,
    CreatedAt: 3,
    CreatedById: 3,
    Id: 3,
    Name: "foo",
    CountryId: Math.random() > .5 ? "foo" : null,
};
