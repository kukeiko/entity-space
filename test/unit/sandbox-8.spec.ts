import { TypeMetadataSymbol, StaticType, Property, TypeSelector, Expandable, Iterable, InstanceOf } from "@sandbox-8";

describe("type-selector", () => {
    it("should create a selected type", () => {
        // arrange
        class AlbumType {
            [TypeMetadataSymbol] = StaticType.Metadata.create(AlbumType);
            name: Property<"name", typeof String> = { key: "name", value: String };
            releasedAt: Property<"releasedAt", typeof String> = { key: "releasedAt", value: String };
            songs: Property<"songs", typeof SongType> & Expandable & Iterable = { key: "songs", value: SongType, expandable: true, iterable: true };
        }

        class SongType {
            [TypeMetadataSymbol] = StaticType.Metadata.create(SongType);
            album: Property<"album", typeof AlbumType> & Expandable = { key: "album", value: AlbumType, expandable: true };
            duration: Property<"duration", typeof Number> = { key: "duration", value: Number };
            name: Property<"name", typeof String> = { key: "name", value: String };
        }

        let sourceType = new AlbumType();
        let songType = new SongType();
        let typeSelector = new TypeSelector(sourceType);

        // act
        let selectedType = typeSelector
            .select(x => x.name)
            .select(x => x.songs, q => q
                .select(x => x.name)
                .select(x => x.duration)
                .select(x => x.album, q => q
                    .select(x => x.releasedAt)
                )
            )
            .build();

        // assert
        let sourceMetadata = selectedType[TypeMetadataSymbol].source[TypeMetadataSymbol];

        if (sourceMetadata.static !== true) {
            fail("source metadata was expected to be static");
        } else {
            expect(sourceMetadata.class).toBe(AlbumType, "source metadata class was expected to be AlbumType");
        }

        expect(selectedType.name).not.toBe(sourceType.name, "expected property to be cloned: name");
        expect(selectedType.name).toEqual(sourceType.name, "expected property to equal the one from source: name");

        expect(selectedType.songs).not.toBe(sourceType.songs as any, "expected property to be cloned: songs");
        expect(selectedType.songs.value instanceof Function).toBe(false, "expanded type was still a class: songs");

        expect(selectedType.songs.value.duration).not.toBe(songType.duration, "expected property to be cloned: songs.duration");
        expect(selectedType.songs.value.duration).toEqual(songType.duration, "expected property to equal the one from source:  songs.duration");

        expect(selectedType.songs.value.album).not.toBe(selectedType as any, "type recursion: songs.album");
        expect(selectedType.songs.value.album).not.toEqual(selectedType as any, "type recursion: songs.album");

        // let foo: InstanceOf<typeof selectedType> = {
        //     name: "trash smash",
        //     songs: [
        //         {
        //             album: {
        //                 releasedAt: "2019-03-12"
        //             },
        //             duration: 493,
        //             name: "awkward goblin"
        //         },
        //         {
        //             album: {
        //                 releasedAt: "2019-03-12"
        //             },
        //             duration: 120,
        //             name: "turkey in the box"
        //         }
        //     ]
        // };
    });
});
