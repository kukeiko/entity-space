import { PrimitiveDefinition } from "./primitive.definition";
import { IdDefinition } from "./id.definition";

export module Definition {
    export import Id = IdDefinition;
    export import Primitive = PrimitiveDefinition;

    export type AllArgs
        = Id.AllArgs
        | Primitive.AllArgs;
}
