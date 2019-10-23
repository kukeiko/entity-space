export interface Expandable {
    expandable: true;
}

export module Expandable {
    export function is(x?: any): x is Expandable {
        return (x as Expandable | undefined) ?.expandable === true;
    }
}
