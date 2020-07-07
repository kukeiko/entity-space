import { Selection } from "src";

class Foo {
    id: number;
    name?: string;
    children?: Foo[];
    parent?: Foo;
}

// $ExpectType { id: number; name: string; children: { id: number; name: string; parent: { id: number; }; }[]; parent: { id: number; }; }
const selected: Selection.Apply<Foo, { name: true; parent: true; children: { name: true; parent: true } }> = {
    id: 3,
    name: "foo",
    children: [{ id: 1, name: "bar", parent: { id: 2 } }],
    parent: {
        id: 7,
    },
};
