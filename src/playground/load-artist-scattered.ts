import { Query } from "../sandbox";
import { ArtistType } from "../user";
import { selectArtistDefaults } from "./select-artist-defaults";
import { selectAlbumDefaults } from "./select-album-defaults";

let artistQuery = new Query<ArtistType>()
    .apply(selectArtistDefaults)
    .select(x => x.albums, q => q.apply(selectAlbumDefaults))
    ;

let queriedArtistType = artistQuery.get();
queriedArtistType.albums.selected.artistId.dtoKey = "ArtistId";
