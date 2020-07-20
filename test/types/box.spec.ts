import { IsExact } from "conditional-type-checks";
import { Box } from "../../src/utils";

// $ExpectType true
type BoxedDefault = IsExact<number[], Box<number>>;

// $ExpectType true
type BoxedExplicit = IsExact<number[], Box<number, string[]>>;

// $ExpectType true
type NotBoxed = IsExact<number, Box<number, Date>>;
