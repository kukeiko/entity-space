import { Entity } from "../../entity/entity";
import { IEntityIndexKeyMap } from "./entity-index-key-map";
import { OnePathEntityIndexKeyMap } from "./one-path-entity-index-key-map";
import { ThreeOrMorePathsEntityIndexKeyMap } from "./three-plus-paths-entity-index-key-map";
import { TwoPathsEntityIndexKeyMap } from "./two-paths-entity-index-key-map";

export function createEntityIndexKeyMap<E extends Entity = Entity, V = unknown>(
    paths: string[]
): IEntityIndexKeyMap<E, V> {
    if (paths.length === 0) {
        throw new Error("paths was empty");
    } else if (paths.length === 1) {
        return new OnePathEntityIndexKeyMap(paths[0]);
    } else if (paths.length === 2) {
        return new TwoPathsEntityIndexKeyMap(paths[0], paths[1]);
    } else {
        return new ThreeOrMorePathsEntityIndexKeyMap(paths.slice(0, -1), paths[paths.length - 1]);
    }
}
