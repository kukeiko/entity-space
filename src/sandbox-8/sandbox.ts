import { Primitive, Unbox, Class } from "./lang";
import { Property, PropertyKeysOf, PropertiesOf } from "./property";
import { Defaulted, Expandable, Iterable, Nullable, Creatable } from "./components";
import { InstanceOf } from "./instance";
import { TypeMetadataSymbol, Type, StaticType, DynamicType } from "./type-metadata";

export type PropertyWithMappedValue<P extends Property, V> = Omit<P, "value"> & { value: V };
export type WithPropertyWithMappedValue<P extends Property, V> = Record<P["key"], PropertyWithMappedValue<P, V>>;

export type DefaultValueOfProperty<P extends Property>
    = P["value"] extends Primitive ? P["value"]
    : {};

export type PickProperties<T, P = Property> = {
    [K in PropertyKeysOf<T, P>]:
    T[K] extends Property ? PropertyWithMappedValue<T[K], DefaultValueOfProperty<T[K]>>
    : never;
};

export class TypeSelector<T extends Type, S = {} & DynamicType> {
    constructor(type: T) {
        this._type = type;

        let selectedType: DynamicType = {
            [TypeMetadataSymbol]: DynamicType.Metadata.create(type)
        };

        this._selected = selectedType as any as S;
    }

    private readonly _type: T;
    private readonly _selected: S;

    select<P extends Property>(
        /**
         * [note]
         * by not using "PropertiesOf<T>" we can support "find references" @ IDE,
         */
        // select: (properties: PropertiesOf<T>) => P
        select: (properties: T) => P
    ): TypeSelector<T, S & WithPropertyWithMappedValue<P, DefaultValueOfProperty<P>>>;

    select<P extends Property & Expandable, E>(
        // select: (properties: PropertiesOf<T, Expandable>) => P,
        select: (properties: T) => P,
        expand: (selector: TypeSelector<Unbox<P["value"]>>) => TypeSelector<Unbox<P["value"]>, E>
        // ): Query<T, Q & WithPropertyWithMappedValue<P, QueriedValueOfProperty<P> & E>>;
    ): TypeSelector<T, S & WithPropertyWithMappedValue<P, E>>;

    select<P extends Defaulted | Creatable>(flags: P): TypeSelector<T, S & PickProperties<T, P>>;

    select(...args: any[]): any {
        if (args.length === 1 && args[0] instanceof Function) {
            this._selectProperty(this._fetchProperty(args[0]));
        } else if (args.length === 2 && args[0] instanceof Function && args[1] instanceof Object) {
            let property = this._fetchProperty(args[0]);
            let type = this._getExpandableType(property);
            let expand: (selector: TypeSelector<any>) => TypeSelector<any> = args[1];
            let expandedType = expand(new TypeSelector(type)).build();
            this._selectProperty(property, expandedType);
        } else {
            throw new Error(`arguments didn't match any overload signature`);
        }

        return this;
    }

    private _fetchProperty(selectsFromType: (type: T) => Property): Property {
        return selectsFromType(this._type);
    }

    private _getExpandableType(property: Property): Type {
        if (!Expandable.is(property)) {
            throw new Error(`property '${property.key}' is not expandable`);
        }

        return property.value instanceof Function ? new property.value() : property.value;
    }

    private _selectProperty(property: Property, value?: any): void {
        let copy = { ...property };

        if (value !== void 0) {
            copy.value = value;
        }

        (this._selected as any)[property.key] = copy;
    }

    build(): S {
        return this._selected;
    }
}

// class FooType {
//     [TypeMetadataSymbol] = StaticType.Metadata.create(FooType);

//     notProperty: string = "foo";

//     level: Property<"level", typeof String> & Defaulted & Creatable = {
//         key: "level",
//         value: String,
//         defaulted: true,
//         creatable: true
//     };

//     bar: Property<"bar", typeof BarType> & Creatable & Expandable & Defaulted = {
//         key: "bar",
//         value: BarType,
//         creatable: true,
//         expandable: true,
//         defaulted: true
//     };
// }

// type FooTypeProperties = PropertiesOf<typeof FooType, Defaulted>;

// let foo: FooTypeProperties = {
//     // bar: new FooType().bar,
//     level: new FooType().level
// };

// class BarType {
//     name: Property<"name", typeof String> & Defaulted = {
//         key: "name",
//         value: String,
//         defaulted: true
//     };

//     level: Property<"level", typeof String> & Defaulted & Nullable = {
//         key: "level",
//         value: String,
//         defaulted: true,
//         nullable: true
//     };

//     achievements: Property<"achievements", typeof Number> & Iterable = {
//         key: "achievements",
//         value: Number,
//         iterable: true
//     };

//     foos: Property<"foos", typeof FooType> & Iterable & Expandable = {
//         key: "foos",
//         value: FooType,
//         expandable: true,
//         iterable: true
//     };
// }

// type FooProperties = PropertiesOf<typeof FooType>;

// let fooProps: FooProperties = new FooType();

// let fooQuery = new TypeSelector(new FooType())
//     .select({ defaulted: true, creatable: true })
//     .select(x => x.level)
//     .select(x => x.bar, q => q.select(x => x.foos, q => q.select(x => x.level)))
//     .select(x => x.bar, q => q.select({ defaulted: true }).select(x => x.achievements))
//     ;

// let fooQueried = fooQuery.build();
// let source = fooQueried[TypeMetadataSymbol].source[TypeMetadataSymbol];
// switch (source.static) {
//     case true: break;
// }
// if (fooQueried[TypeMetadataSymbol].source[TypeMetadataSymbol].static === false) {

// }
// let fooQueriedBarQuery = new TypeSelector(fooQueried.bar.value)
//     .select(x => x.achievements)
//     ;

// fooQueried.level.defaulted;
// // fooQueried.bar.value.
// fooQueried.bar.value.level;
// // fooQueried.bar.value.
// // fooQueried.

// let fooQueriedInstance: InstanceOf<typeof fooQueried> = {
//     bar: {
//         foos: [
//             {
//                 level: "foo"
//             }
//         ],
//         level: null,
//         name: "bar",
//         achievements: [1, 2, 3]
//     },
//     level: "foo"
// };

// // fooQueried.bar?.value.name?.value = String;


// interface AlbumType {
//     level: Property<"level", typeof String> & Defaulted & Creatable;
// }

// type PartialAlbumType = PickProperties<AlbumType>;

// let x: PartialAlbumType = {
//     level: {
//         creatable: true,
//         defaulted: true,
//         key: "level",
//         value: String
//     }
// };

// type Foo = PickProperties<FooType>;

// // if (partialFooType.bar !== void 0) {
// //     partialFooType.bar.value.foo?.value.bar?.value.foo?.value.bar?.value.level?.defaulted;
// //     // partialFooType.bar.
// // }
