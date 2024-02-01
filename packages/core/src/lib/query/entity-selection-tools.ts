import { isNotNullsyEntryValue, toDestructurableInstance, toMap } from "@entity-space/utils";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ClippedEntitySelection, IEntitySelectionTools } from "./entity-selection-tools.interface";
import { IEntitySchema } from "../schema/schema.interface";
import { EntitySelection } from "./entity-selection";

export class EntitySelectionTools implements IEntitySelectionTools {
    toDestructurable(): IEntitySelectionTools {
        return toDestructurableInstance(this);
    }

    // [todo] I think I was a bit sloppy when implementing hydrating relations of complex types by introducing
    // this extra "clip()" method, when it should be enough to use subtraction & a new method on EntitySelection
    // that will return an an array of [PropertyPath, SelectedValue][]
    clip(what: UnpackedEntitySelection, by: UnpackedEntitySelection): ClippedEntitySelection[] {
        const clipInternal = (
            what: UnpackedEntitySelection,
            by: UnpackedEntitySelection,
            path: string[]
        ): ClippedEntitySelection[] => {
            const clipped: ClippedEntitySelection[] = [];

            for (const [key, value] of Object.entries(what)) {
                if (value === void 0) {
                    continue;
                }

                const other = by[key];

                if (other === void 0) {
                    clipped.push([[...path, key], value]);
                } else if (other !== true && value !== true) {
                    clipped.push(...clipInternal(value, other, [...path, key]));
                }
            }

            return clipped;
        };

        return clipInternal(what, by, []);
    }

    getRelatedSchemas(selection: EntitySelection): IEntitySchema[] {
        const schemas: IEntitySchema[] = [];
        this.getRelatedSchemasCore(selection.getSchema(), selection.getValue(), schemas);
        return schemas;
    }

    private getRelatedSchemasCore(
        schema: IEntitySchema,
        selection: UnpackedEntitySelection,
        schemas: IEntitySchema[]
    ): void {
        for (const [key, selected] of Object.entries(selection).filter(isNotNullsyEntryValue)) {
            const relation = schema.findRelation(key);

            if (!relation) {
                continue;
            }

            const relatedSchema = relation.getRelatedEntitySchema();
            schemas.push(relatedSchema);

            if (selected !== true) {
                this.getRelatedSchemasCore(relatedSchema, selected, schemas);
            }
        }
    }
}
