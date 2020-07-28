import { Class } from "../utils";
import { Query } from "./query";
import { QueryTranslator } from "./query-translator";
import { PayloadHydrator } from "./payload-hydrator";

export interface ComponentProvider {
    getTranslator(query: Query): QueryTranslator;
    getHydrator(model: Class): PayloadHydrator;
}
