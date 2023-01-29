import { BlueprintInstance } from "../../../lib/common/schema/blueprint-instance";
import { ShapeBlueprint } from "./shape.model";

let id = 1;

function nextId(): number {
    return id++;
}

export class ShapeRepository {
    all(): BlueprintInstance<ShapeBlueprint>[] {
        return [
            {
                type: "circle",
                id: nextId(),
                area: Math.PI * Math.pow(7, 2),
                radius: 7,
            },
            {
                type: "square",
                id: nextId(),
                length: 3,
                area: Math.pow(3, 2),
            },
            {
                type: "triangle",
                id: nextId(),
                angleA: 60,
                angleB: 60,
                angleC: 60,
                area: 64,
            },
        ];
    }
}
