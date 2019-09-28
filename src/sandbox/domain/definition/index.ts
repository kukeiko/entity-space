import { PrimitiveDefinition } from "./primitive.definition";
import { IdDefinition } from "./id.definition";
import { ComplexDefinition } from "./complex.definition";
import { ReferenceDefinition } from "./reference.definition";

export module Definition {
    export import Id = IdDefinition;
    export import Primitive = PrimitiveDefinition;
    export import Complex = ComplexDefinition;
    export import Reference = ReferenceDefinition;

    export type AllArgs
        = Id.AllArgs
        | Id.Computed.AllArgs
        | Primitive.AllArgs
        | Primitive.Computed.AllArgs
        | Primitive.Ethereal.AllArgs
        | Primitive.Array.AllArgs
        | Primitive.Array.Deserialized.AllArgs
        | Complex.AllArgs
        | Complex.Ethereal.AllArgs
        | Complex.Array.AllArgs
        | Reference.AllArgs
        ;
}
