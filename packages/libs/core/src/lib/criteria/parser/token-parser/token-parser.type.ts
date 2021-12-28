import { Criterion } from "../../criterion";
import { Token } from "../token.contract";

export type TokenParser = Generator<undefined | (() => Criterion), false | (() => Criterion), Token>;
