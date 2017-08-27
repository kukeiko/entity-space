import { Complex } from "./complex";
import { DateTime } from "./date";
import { Instance } from "./instance";
import { Primitive } from "./primitive";

/**
 * All the supported types of local properties.
 */
export type Local =
    Complex
    | DateTime
    | Instance
    | Primitive;
