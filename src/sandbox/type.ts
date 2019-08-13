export interface Type<K extends string> {
    $: Type.Metadata<K>;
}

export module Type {
    export interface Metadata<K extends string> {
        key: K;
    }
}
