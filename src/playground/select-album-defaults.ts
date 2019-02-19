import { Query } from "../sandbox";
import { AlbumType } from "../user";

export function selectAlbumDefaults(q: Query<AlbumType>) {
    return q
        .select(x => x.id)
        .select(x => x.artistId);
}
