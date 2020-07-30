import { createProperty } from "src";
import { MetadataModel } from "./metadata.model";

export abstract class DataEntryModel {
    metadata = createProperty("metadata", [MetadataModel], b => b.loadable(["optional"]));
}
