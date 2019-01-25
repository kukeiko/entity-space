import { Navigation } from "@metadata";
import { Selection } from "./selection";

export interface Expansion {
    navigation: Navigation;
    expansions: Expansion[];
    selection: Selection;
}

export module Expansion {

}
