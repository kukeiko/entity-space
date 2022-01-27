import { Null } from "../null";
import { Primitive } from "./primitive";

export type PrimitiveIncludingNull = Primitive | typeof Null;
