import { Reference } from "./reference";
import { Children } from "./children";
import { Collection } from "./collection";

/**
 * All the supported types of navigation.
 *
 * todo: redo doc (also of all navigation implementations, in case they are still sh*t)
 */
export type Navigation =
    Reference
    | Children
    | Collection;

export module Navigation {
    export type Type = Navigation["type"];
}
