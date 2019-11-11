import { TypeMetadataSymbol, StaticType, Property, InstanceLoader, TypeQuery, TypeInstance, isFlagged, allFlags, Flag, Flagged, PickRequiredProperties, WithState, WidenValueForState } from "@sandbox-8";

describe("flag.ts", () => {
    it("allFlags() should contain all the flags shipped with entity-space", () => {
        let expected: Flag[] = ["creatable", "expandable", "filterable", "iterable", "loadable", "nullable", "patchable", "unique", "voidable"];
        let actual = allFlags();

        expect(actual).toEqual(expected);
    });

    it("isFlagged() should return true if object extends { [flag]: true }", () => {
        let isFlaggedAsCreatable = {
            creatable: true
        };

        expect(isFlagged(isFlaggedAsCreatable, "creatable"))
            .toBe(true, `expected '${JSON.stringify(isFlaggedAsCreatable)}' to have a property named 'creatable' set to true`);
    });
});

describe("instance-loader", () => {
    it("should do stuff", () => {
        class AlbumType {
            [TypeMetadataSymbol] = StaticType.Metadata.create(AlbumType);
            name: Property<"name", typeof String> = { key: "name", value: String };
            releasedAt: Property<"releasedAt", typeof String> = { key: "releasedAt", value: String };
            songs: Property<"songs", typeof SongType> & Flagged<"expandable"> & Flagged<"iterable"> & Flagged<"loadable"> = {
                key: "songs", value: SongType, expandable: true, iterable: true, loadable: true
            };
        }

        class SongType {
            [TypeMetadataSymbol] = StaticType.Metadata.create(SongType);
            album: Property<"album", typeof AlbumType> & Flagged<"expandable"> & Flagged<"loadable"> = { key: "album", value: AlbumType, expandable: true, loadable: true };
            duration: Property<"duration", typeof Number> = { key: "duration", value: Number };
            name: Property<"name", typeof String> = { key: "name", value: String };
        }

        let albumTypeInstanceLoader: InstanceLoader<AlbumType> = {
            load(loadable, criteria) {
                loadable.songs?.value[TypeMetadataSymbol].source[TypeMetadataSymbol].class;

                new loadable[TypeMetadataSymbol].source[TypeMetadataSymbol].class();
                let metadata = loadable[TypeMetadataSymbol].source[TypeMetadataSymbol].class;
                loadable[TypeMetadataSymbol].source[TypeMetadataSymbol].class;
                loadable.songs?.value[TypeMetadataSymbol].source;

                for (let k in loadable) {

                }

                return new Map([
                    [1, {}]
                ]);
            }
        };

        let anyTypeInstanceLoader: InstanceLoader<AlbumType | SongType> = {
            load(loadable) {
                let metadata = loadable[TypeMetadataSymbol].source[TypeMetadataSymbol];

                if (metadata.class === AlbumType) {
                    new metadata.class().releasedAt.key;
                }
                // if (metadata.class === AlbumType) {

                // }
                // if (type[TypeMetadataSymbol].class === AlbumType) {
                //     // new type[TypeMetadataSymbol].class().
                // }

                return new Map([
                    [1, {}]
                ]);
            }
        };
    });
});

describe("type-query", () => {
    it("should do stuff", () => {
        // arrange
        class AlbumType {
            [TypeMetadataSymbol] = StaticType.Metadata.create(AlbumType);
            name: Property<"name", typeof String> & Flagged<"filterable"> & Flagged<"creatable"> & Flagged<"patchable"> & Flagged<"nullable"> & Flagged<"unique"> = { key: "name", value: String, filterable: true, creatable: true, patchable: true, nullable: true, unique: true };
            // name: Property<"name", typeof String> & Flagged<"filterable"> & Flagged<"creatable"> = { key: "name", value: String, filterable: true, creatable: true };
            releasedAt: Property<"releasedAt", typeof String> = { key: "releasedAt", value: String };
            songs: Property<"songs", typeof SongType> & Flagged<"creatable"> & Flagged<"expandable"> & Flagged<"iterable"> = { key: "songs", value: SongType, expandable: true, iterable: true, creatable: true };

            // foo: Property<"foo", typeof SongType> & Flagged<"iterable"> & WithState<"creatable", true, true> = { key: "foo", value: SongType, iterable: true, creatable: { nullable: true, voidable: true } };
            foo: Property<"foo", typeof SongType> & WithState<"creatable", true, true> = { key: "foo", value: SongType, creatable: { nullable: true, voidable: true } };
        }

        class SongType {
            [TypeMetadataSymbol] = StaticType.Metadata.create(SongType);
            album: Property<"album", typeof AlbumType> & Flagged<"expandable"> & WithState<"creatable"> = { key: "album", value: AlbumType, expandable: true, creatable: { nullable: false, voidable: false } };
            duration: Property<"duration", typeof Number> & Flagged<"filterable"> & Flagged<"creatable"> = { key: "duration", value: Number, filterable: true, creatable: true };
            name: Property<"name", typeof String> & Flagged<"creatable"> = { key: "name", value: String, creatable: true };

            bar: Property<"bar", typeof String> & WithState<"creatable", true> = { key: "bar", value: String, creatable: { nullable: true, voidable: false } };
        }

        let albumProps: PickRequiredProperties<AlbumType, Flagged<"creatable">> = {
            name: new AlbumType().name,
            // releasedAt: new AlbumType().releasedAt,
            songs: {
                creatable: true,
                expandable: true,
                iterable: true,
                key: "songs",
                // value: SongType
                value: {
                    [TypeMetadataSymbol]: null as any,
                    duration: new SongType().duration,
                    name: new SongType().name
                }
            }
        };

        interface Foo {
            bar?: number;
        }

        type X = Pick<Foo, "bar">;


        let albumType = new AlbumType();

        // let creatableProperties: PickProperties<AlbumType, Flagged<"creatable">> = {
        //     name: albumType.name
        // };

        // let foo = new TypeSelector(new AlbumType()).select(["creatable", "patchable"]).
        // let testQuery = new TypeQuery(new AlbumType()).select(ts => ts.select(["creatable", "patchable", "unique"])).build();
        let testQuery = new TypeQuery(new AlbumType()).select(ts => ts.select(["creatable"])).build();

        let x: TypeInstance<typeof testQuery["selected"]> = {
            name: "foo",
            songs: [
                {
                    duration: 3,
                    name: "bar"
                }
            ]
        };

        let typeQuery = new TypeQuery(new AlbumType());

        let selectedType = typeQuery
            .select(s => s
                .selectWithState(["creatable"])
                // .select(x => x.name)
                .select(x => x.songs, q => q.select(x => x.duration).select(x => x.name))
                .select(["creatable"])
            )
            .where(c => c
                .equals(x => x.name, "foo")
                .select(x => x.songs, c => c
                    .equals(x => x.duration, 120)
                )
            )
            .where("or", c => c
                .equals(s => s.name, "quak")
            )
            .build()
            ;

        type H = typeof selectedType["selected"]["foo"];
        type Widened = WidenValueForState<typeof selectedType["selected"]["foo"], "creatable", string>;

        let instance: TypeInstance<typeof selectedType["selected"]> = {
            foo: {
                bar: "bar",
                album: {
                    foo: {

                    } as any
                }
            },
            name: null,
            songs: [
                {
                    duration: 123,
                    name: "bar"
                }
            ]
        };

        // let filtersName = (cb: CriteraBuilder<SelectedType<AlbumType>>) => {
        //     cb.equals(x => x.name, "lala");
        //     cb.equals("foo", x => x.name);
        //     cb.equals("lala", x => x.name);
        // };
    });
});
