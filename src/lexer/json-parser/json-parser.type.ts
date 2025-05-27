import { Json } from "@entity-space/utils";
import { Token } from "../token";

export type JsonParser = Generator<undefined | (() => Json), false | (() => Json), Token>;
