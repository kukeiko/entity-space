import { Component as _Component } from "../component";
import { Id as _Id } from "./id";
import { Primitive as _Primitive } from "./primitive";
import { Complex as _Complex } from "./complex";
import { Reference as _Reference } from "./reference";
import { Children as _Children } from "./children";

export module Property {
    /**
     * [note]
     * re-exporting component because without it, type hints for the generic arguments
     * while declaring properties on a type show the absolute path to component.ts
     */
    export import Component = _Component;
    export import Id = _Id;
    export import Primitive = _Primitive;
    export import Complex = _Complex;
    export import Reference = _Reference;
    export import Children = _Children;
}
