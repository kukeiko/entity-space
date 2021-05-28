/**
 * Something that knows how to reduce something else of the same shape.
 *
 * Examples:
 * - { id: equals 1 } could reduce { id: equals 1 } to null
 * - { id: equals 1 } could reduce { id: in [1,2,3] } to { id: in [2,3] }
 * - { foo: { bar, baz } } could reduce { foo: { bar, baz, zoo } } to { foo: { zoo } }
 */
export interface Reducible {
    // [todo] return values no longer up-to-date, should return "false" for no reduction, "array" for full/partial reduction
    reduce(other: this): this | null;
}
