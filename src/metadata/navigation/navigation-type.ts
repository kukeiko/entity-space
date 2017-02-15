import { Reference } from "./reference";
import { Children } from "./children";
import { Collection } from "./collection";

/**
 * All the supported types of navigation.
 */
export type NavigationType =
    Reference
    | Children
    | Collection;
