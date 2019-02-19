import { Query, Instance } from "../sandbox";
import { ArtistType } from "../user";

let artistQuery = new Query<ArtistType>()
    .select(x => x.countryId)
    .select(x => x.reviewIds, [[f => f.intersectsWith([1, 2, 3])]])
    .select(x => x.albums, q => q.select(x => x.id))
    ;

// function takesArtistInstance(artist: Instance<typeof builtMappedArtist>): void {
//     if (artist.albums !== undefined) {
//         artist.albums.forEach(album => {
//             if (album.artist !== null) {
//                 album.artist.parentId;
//             }
//         });
//     }

//     artist.createdBy.id.toFixed();
//     artist.changedById = null;

//     if (artist.createdBy.name !== null) {
//         artist.createdBy.name.charAt(1);
//     }

//     if (artist.id !== undefined) {
//         artist.id.toFixed();
//     }

//     if (artist.changedBy != null) {
//         if (artist.changedBy.createdBy != null) {
//             if (artist.changedBy.createdBy.name !== null) {
//                 artist.changedBy.createdBy.name.charAt(1);
//             }
//         }
//     }

//     if (artist.parent !== null) {
//         if (artist.parent.country !== null) {
//             artist.parent.country.createdById.toFixed();
//         }
//     }

//     if (artist.country !== null) {
//         artist.country.createdById.toFixed();
//         artist.country.createdBy.id.toFixed();

//         if (artist.country.createdBy.name !== null) {
//             artist.country.createdBy.name.charAt(1);
//         }

//         if (artist.country.changedBy !== null) {
//             artist.country.changedBy.id.toFixed();

//             if (artist.country.changedBy.name !== null) {
//                 artist.country.changedBy.name.charAt(1);
//             }
//         }
//     }
// }

// function takesArtistDtoInstance(artist: Instance.Dto<typeof builtMappedArtist>): void {
//     if (artist.Albums !== undefined) {
//         artist.Albums.forEach(album => {
//             if (album.Artist !== null) {
//                 album.Artist.ParentId;
//             }
//         });
//     }

//     artist.CreatedBy.Id.toFixed();

//     if (artist.CreatedBy.Name !== null) {
//         artist.CreatedBy.Name.charAt(1);
//     }

//     if (artist.Id !== undefined) {
//         artist.Id.toFixed();
//     }

//     // artist.ChangedBy = null;

//     if (artist.ChangedBy != null) {
//         if (artist.ChangedBy.CreatedBy != null) {
//             if (artist.ChangedBy.CreatedBy.Name !== null) {
//                 artist.ChangedBy.CreatedBy.Name.charAt(1);
//             }
//         }
//     }

//     // artist.Parent = null;

//     if (artist.Parent !== null) {
//         if (artist.Parent.Country !== null) {
//             artist.Parent.Country.CreatedById.toFixed();
//         }
//     }

//     if (artist.Country !== null) {
//         artist.Country.CreatedById.toFixed();
//         artist.Country.CreatedBy.Id.toFixed();

//         if (artist.Country.CreatedBy.Name !== null) {
//             artist.Country.CreatedBy.Name.charAt(1);
//         }

//         if (artist.Country.ChangedBy !== null) {
//             artist.Country.ChangedBy.Id.toFixed();

//             if (artist.Country.ChangedBy.Name !== null) {
//                 artist.Country.ChangedBy.Name.charAt(1);
//             }
//         }
//     }
// }
