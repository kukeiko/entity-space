import { Property } from "./property";
import { Instance } from "./instance";
import { PropertyComponent } from "./component/property.component";

export abstract class EntityType {
    abstract getProperties(): Record<string, Property>;
}

export class TypeBuilder<P = {}> {
    addNumber<K extends string, F extends PropertyComponent.Flags = never>(key: K, flags: F[] = [])
        : TypeBuilder<P & Record<K, Property.Number<K, F>>> {
        return this as any;
    }

    addString<K extends string, F extends PropertyComponent.Flags = never>(key: K, flags: F[] = [])
        : TypeBuilder<P & Record<K, Property.String<K, F>>> {
        return this as any;
    }

    // addReference<K extends string, V extends EntityType>(key: K, type: V)
    addReference<K extends string, V>(key: K, type: V)
        : TypeBuilder<P & Record<K, Property.Reference<K, V>>> {
        return this as any;
    }

    add2<K extends string, V extends Property.Primitive.ValueType, F extends PropertyComponent.Flags = never>(key: K, valueType: V, flags: F[] = [])
        : TypeBuilder<P & Record<K, Property.Primitive<K, V, F>>> {
        return this as any;
    }

    add<K extends string, V extends Property.Primitive.ValueType, F extends PropertyComponent.Flags = never>(property: Property.Primitive<K, V, F>)
        : TypeBuilder<P & Record<K, Property.Primitive<K, V, F>>> {
        return this as any;
    }

    build(): P {
        return {} as any;
    }
}

class ArtistType extends EntityType {
    getProperties() {
        return {
            albums: new TypeBuilder().addReference("albums", new AlbumType()).build().albums,
            name: new TypeBuilder().addString("name").build().name,
        };
    }
}

class AlbumType extends EntityType {
    getProperties() {
        return {
            artist: new TypeBuilder().addReference("artist", new ArtistType()).build().artist,
            name: new TypeBuilder().addString("name").build().name,
        };
        // return new TypeBuilder().addString("name").build().properties;
    }
}

new AlbumType().getProperties().name.read({ name: "foo" }).charAt(2);

