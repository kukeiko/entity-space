import { EntityBlueprint } from "../../entity/entity-blueprint";

const { register, number, optional } = EntityBlueprint;

export class ArtistRequestBlueprint {
    page = number({ optional });
    pageSize = number({ optional });
}

register(ArtistRequestBlueprint, { name: "artist-request" });

export type ArtistRequest = EntityBlueprint.Instance<ArtistRequestBlueprint>;
