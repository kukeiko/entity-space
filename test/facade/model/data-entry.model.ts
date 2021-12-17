import { define } from "@entity-space/core";
import { MetadataModel } from "./metadata.model";

export abstract class DataEntryModel {
    metadata = define(MetadataModel);
}
