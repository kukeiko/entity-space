import { Query, Instance } from "../sandbox";
import { ArtistType } from "../user";

let artistQuery = new Query<ArtistType>()
    .selectIf(x => x.systemArtistId)
    .select(x => x.numDigitsOfSystemId)
    .select(x => x.id)
    .select(x => x.systemId)
    .select(x => x.createdAt, [
        x => x.fromTo(["2018-01-01", "2019-01-01"], false),
        x => x.to("1970-04-06")
    ])
    .selectIf(x => x.changedAt)
    .select(x => x.countryId)
    .select(x => x.changedById)
    .select(x => x.albums, q => q.select(x => x.artistId).select(x => x.artist, q => q.select(x => x.parentId).select(x => x.changedById)))
    .select(x => x.country, q => q
        .select(x => x.createdBy, q => q.select(x => x.name, [f => f.equals("susi")]))
        .select(x => x.name, [x => x.in(["austria", "germany", "hungary"])])
        .select(x => x.population)
    )
    .select(x => x.country, q => q
        .select(x => x.changedBy, q => q.select(x => x.id))
        .select(x => x.createdBy, q => q.select(x => x.id))
    )
    .select(x => x.country, q => q
        .select(x => x.changedBy, q => q.select(x => x.name))
    )
    .select(x => x.createdBy, q => q.select(x => x.id))
    .select(x => x.createdBy, q => q.select(x => x.id).select(x => x.name))
    .select(x => x.parent, q => q.select(x => x.country, q => q.select(x => x.createdById).select(x => x.id).select(x => x.name).select(x => x.createdBy, q => q.select(x => x.id).select(x => x.name))))
    .select(x => x.country, q => q.select(x => x.createdById).select(x => x.id).select(x => x.name))
    .select(x => x.country, q => q.select(x => x.name))
    .select(x => x.country, q => q.select(x => x.id).select(x => x.createdById))
    .select(x => x.country, q => q.select(x => x.createdBy, q => q))
    .select(x => x.country, q => q.select(x => x.createdBy, q => q.select(x => x.id)))
    .select(x => x.country, q => q.select(x => x.createdBy, q => q.select(x => x.name)))
    .selectIf(x => x.changedBy, q => q.selectIf(x => x.createdBy, q => q.select(x => x.name)))
    // .select(x => x.countryId, f =>)
    // .select(x => x.systemZone)
    .select(x => x.reviewIds)
    .select(x => x.parentId)
    ;

let x: { foo: 3 } = {
    foo: 3
};

let builtMappedArtist = artistQuery.get();
let builtMappedArtistInstances: Instance<typeof builtMappedArtist[]> = [
    {
        systemArtistId: Math.random() > .5 ? undefined : 64,
        reviewIds: [1, 2, 3],
        numDigitsOfSystemId: 1,
        id: "foo@2",
        systemId: "2",
        // systemId: Math.random() > .5 ? null : "2",
        createdAt: "2016-02-05",
        changedAt: "2018-01-01",
        parentId: "bar@2",
        // parentId: Math.random() > .5 ? "foo" : null,
        albums: [{
            artistId: null,
            artist: {
                parentId: "foo",
                changedById: Math.random() > .5 ? 3 : null
            }
        }],
        changedById: null,
        changedBy: Math.random() > .5 ? null : undefined,
        countryId: null,
        createdBy: {
            id: 1,
            name: "foo"
        },
        country: {
            changedBy: {
                id: "foo",
                name: ""
            },
            createdBy: {
                id: "foo",
                name: ""
            },
            createdById: "foo",
            id: "foo",
            name: "foo",
            population: 3
            // population: 64,
            // changedBy: {
            //     id: 3,
            //     name: "foo"
            // },
            // createdBy: {
            //     id: 8,
            //     name: null
            // },
            // createdById: 8,
            // id: "quak",
            // name: "khaz"
        },
        parent: null
    }
];

let builtMappedArtistDtoInstances: Instance.Dto<(typeof builtMappedArtist)[]> = [
    {
        ReviewIds: [1, 2, 3],
        CreatedAt: 123,
        ChangedAt: "2018-01-01",
        Albums: [{
            // ArtistId: Math.random() > .5 ? "foo" : undefined,
            // Artist: {
            //     ParentId: null
            // }
            ArtistId: null,
            Artist: {
                ChangedById: Math.random() > .5 ? 3 : null,
                ParentId: null
                // ParentId: "foo",
            }
        }],
        ChangedBy: null,
        ChangedById: null,
        Country: null,
        CountryId: null,
        CreatedBy: {
            Id: 1,
            Name: null
        },
        Id: undefined,

        Parent: {
            Country: {
                CreatedBy: {
                    Id: 3,
                    Name: "austria"
                },
                CreatedById: 3,
                id: "moo",
                Name: "foo"
            }
        },
        // SystemId: Math.random() > .5 ? null : 3
    }
];

function takesArtistInstance(artist: Instance<typeof builtMappedArtist>): void {
    if (artist.albums !== undefined) {
        artist.albums.forEach(album => {
            if (album.artist !== null) {
                album.artist.parentId;
            }
        });
    }

    artist.createdBy.id.toFixed();
    artist.changedById = null;

    if (artist.createdBy.name !== null) {
        artist.createdBy.name.charAt(1);
    }

    if (artist.systemArtistId !== undefined) {
        artist.systemArtistId.toFixed();
    }

    if (artist.changedBy != null) {
        if (artist.changedBy.createdBy != null) {
            if (artist.changedBy.createdBy.name !== null) {
                artist.changedBy.createdBy.name.charAt(1);
            }
        }
    }

    if (artist.parent !== null) {
        if (artist.parent.country !== null) {
            artist.parent.country.createdById.charAt(0);
        }
    }

    if (artist.country !== null) {
        artist.country.createdById.charAt(0);
        artist.country.createdBy.id.charAt(0);

        if (artist.country.createdBy.name !== null) {
            artist.country.createdBy.name.charAt(1);
        }

        if (artist.country.changedBy !== null) {
            artist.country.changedBy.id.charAt(0);

            if (artist.country.changedBy.name !== null) {
                artist.country.changedBy.name.charAt(1);
            }
        }
    }
}

function takesArtistDtoInstance(artist: Instance.Dto<typeof builtMappedArtist>): void {
    if (artist.Albums !== undefined) {
        artist.Albums.forEach(album => {
            if (album.Artist !== null) {
                album.Artist.ChangedById;
            }
        });
    }

    artist.CreatedBy.Id.toFixed();

    if (artist.CreatedBy.Name !== null) {
        artist.CreatedBy.Name.charAt(1);
    }

    if (artist.Id !== undefined) {
        artist.Id.toFixed();
    }

    // artist.ChangedBy = null;

    if (artist.ChangedBy != null) {
        if (artist.ChangedBy.CreatedBy != null) {
            if (artist.ChangedBy.CreatedBy.Name !== null) {
                artist.ChangedBy.CreatedBy.Name.charAt(1);
            }
        }
    }

    // artist.Parent = null;

    if (artist.Parent !== null) {
        if (artist.Parent.Country !== null) {
            // artist.Parent.Country.CreatedById.toFixed();
        }
    }

    if (artist.Country !== null) {
        // artist.Country.CreatedById.toFixed();
        // artist.Country.CreatedBy.Id.toFixed();

        // if (artist.Country.CreatedBy.Name !== null) {
        //     artist.Country.CreatedBy.Name.charAt(1);
        // }

        // if (artist.Country.ChangedBy !== null) {
        //     artist.Country.ChangedBy.Id.toFixed();

        //     if (artist.Country.ChangedBy.Name !== null) {
        //         artist.Country.ChangedBy.Name.charAt(1);
        //     }
        // }
    }
}
