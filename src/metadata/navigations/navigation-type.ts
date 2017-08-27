import { Reference } from "./reference";
import { Children } from "./children";
import { Collection } from "./collection";

/**
 * All the supported types of navigation.
 */
export type Navigation =
    Reference
    | Children
    | Collection;
