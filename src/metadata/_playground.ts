import { TypeOf } from "../util";
import { AnyClassMetadata, ClassMetadata, getMetadata } from "./class-metadata";

export interface _NoArgsInstantiable<T> extends Function {
    new(): T;
    prototype: T;
}

// note: planned to have state stuff (errors and whatnot)
export class _EntityMetadata<T> {
    metadata: ClassMetadata<T>;

    constructor() {

    }
}

export interface _Entity<T> {
    $: _EntityMetadata<T>;
    [key: string]: any;
    // stuff: this[];
}

export interface _EntityType<T extends _Entity<T>> extends _NoArgsInstantiable<T> {
    $: ClassMetadata<T>;
}

export type _AnyEntityType = _EntityType<any>;

import { EntityClass, } from "./class-metadata";

@EntityClass({
    primaryKey: { name: "id" },
    primitives: { name: {} }
})
export class FooClass implements _Entity<FooClass> {
    id: number;
    name: string;
    $: _EntityMetadata<FooClass>;
    static $: ClassMetadata<FooClass>;
}

FooClass.$ = getMetadata(FooClass);

function bar<T extends _Entity<T>>(t: _EntityType<T>): void {

}

bar(FooClass);

let x = new FooClass();

// let foo :_EntityType<TagType>;
