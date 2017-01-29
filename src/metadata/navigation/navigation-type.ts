import { Reference } from "./reference";
import { Children } from "./children";
import { Collection } from "./collection";

/**
 * Union of all navigation types
 */
export type NavigationType =
    Reference
    | Children
    | Collection;
