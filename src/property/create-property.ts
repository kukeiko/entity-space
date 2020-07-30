import { Property } from "./property";
import { PropertyBuilder } from "./property-builder";

export function createProperty<K extends string, V extends Property.Value, P extends Property<K, V> = Property<K, V>>(
    key: K,
    value: V,
    builder: (builder: PropertyBuilder<K, V>) => PropertyBuilder<K, V, P> = builder => builder as PropertyBuilder<K, V, P>
): P {
    return builder(new PropertyBuilder(key, value)).build();
}
