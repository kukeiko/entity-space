import { define } from "@entity-space/model";
import { MetadataModel } from "./metadata.model";

export abstract class DataEntryModel {
    metadata = define(MetadataModel);
}
