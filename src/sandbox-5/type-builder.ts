import { ReferenceProperty, StringProperty, PropertyBase, NavigableProperty } from "./property";
import { ArtistType } from "./types/artist.type";
import { RequiredCreatableInstance, Instance } from "./instance";

export type PropertyName<P>
    = P extends PropertyBase<any, any, any, infer F> ? P["name"] : never;

type StringPropertyKeys<S> = ({ [Z in keyof S]: S[Z] extends StringProperty<any, any, any> ? Z : never })[keyof S];

export class TypeBuilder<S = {}, B = {}> {
    select<P extends StringProperty<any, any, any>>(
        // _: (foo: { [Z in StringPropertyKeys<S>]: S[Z] extends StringProperty<any, any, any> ? S[Z] : never }) => P
        _: (foo: { [Z in StringPropertyKeys<S>]: S[Z] }) => P
    ): TypeBuilder<S, Record<PropertyName<P>, StringProperty<P["name"], P["nullable"], P["flags"]>> & B>;

    select<P extends ReferenceProperty<any, any, any, any> | undefined, O>(
        _0: (foo: Required<S>) => P,
        _1: (tb: TypeBuilder<Exclude<P, undefined>["referenced"]>) => TypeBuilder<any, O>
    ): TypeBuilder<S, Record<Exclude<P, undefined>["name"], ReferenceProperty<Exclude<P, undefined>["name"], O, Exclude<P, undefined>["nullable"], Exclude<P, undefined>["flags"]>> & B>;

    select(...args: any[]): any {
        return this;
    }

    quak<P extends NavigableProperty<any> & PropertyBase<any, any, any, any>, O>(
        _0: (foo: Required<S>) => P,
        _1: (tb: TypeBuilder<P["navigated"]>) => TypeBuilder<any, O>
    ): TypeBuilder<S, Record<P["name"], NavigableProperty<O> & P>> {
        return this as any;
    }

    selectIf<P extends ReferenceProperty<any, any, any, any> | undefined, O>(
        _0: (foo: Required<S>) => P,
        _1: (tb: TypeBuilder<Exclude<P, undefined>["referenced"]>) => TypeBuilder<any, O>
    ): TypeBuilder<S, Record<Exclude<P, undefined>["name"], ReferenceProperty<Exclude<P, undefined>["name"], O, Exclude<P, undefined>["nullable"], Exclude<P, undefined>["flags"]> | undefined> & B>;

    selectIf(...args: any[]): any {
        return this;
    }

    get(): B {
        return {} as any;
    }
}

let builder2 = new TypeBuilder<ArtistType, {}>()
.select(x => x.name)
    .quak(x => x.album, tb => tb
        .select(x => x.name)
        // .quak(x => x.createdBy, tb => tb
        //     .select(x => x.username)
        //     .select(x => x.password)
        // )
        // .quak(x => x.updatedBy, tb => tb
        //     .select(x => x.password)
        // )
    );

builder2.get().album.type = "reference";
builder2.get().album.navigated.artist;
builder2.get().album.navigated.createdBy.navigated.password;
builder2.get().album.navigated.updatedBy.read({ updatedBy: null });

let builder = new TypeBuilder<ArtistType, {}>()
    .select(x => x.album, tb => tb
        .select(x => x.name)
        .select(x => x.artist, tb => tb
            .select(x => x.name)))
    .select(x => x.createdBy, tb => tb
        .select(x => x.username))
    .select(x => x.createdBy, tb => tb
        .select(x => x.password))
    .selectIf(x => x.updatedBy, tb => tb
        .select(x => x.username)
        .select(x => x.password)
    );

// foo.get().album.read({ album: { name: "foo" } }) ?.name?.anchor("foo");
builder.get().album.referenced.artist.referenced.name.patchable;
builder.get().album.referenced.name.unique;
builder.get().createdBy.referenced.username.creatable;
builder.get().createdBy.referenced.username.patchable;
builder.get().createdBy.referenced.username.unique;
builder.get().createdBy.referenced.password;
builder.get().updatedBy?.referenced.username;
builder.get().updatedBy?.referenced.password?.patchable;

let builtType = builder.get();

let builtInstance: Instance<typeof builtType> = {
    album: {
        artist: {
            name: "foo"
        },
        name: "bar"
    },
    createdBy: {
        username: "Susi"
    },
    updatedBy: {
        password: "pw",
        username: "un"
    }
};

let builtCreatableInstance: RequiredCreatableInstance<typeof builtType> = {
    album: {
        artist: {
            name: "foo"
        },
        name: "bar"
    },
    createdBy: {
        username: "susi"
    }
};
