import { EntityBlueprint } from "../../entity/entity-blueprint";
import { WashingMachineBlueprint } from "./washing-machine.model";

const { register, id, string, number, entity, nullable } = EntityBlueprint;

export class ProductBlueprint {
    id = id();
    name = string();
    price = number();
    washingMachine = entity(WashingMachineBlueprint, this.id, washingMachine => washingMachine.id, { nullable });
}

register(ProductBlueprint, { name: "product" });

export type Product = EntityBlueprint.Instance<ProductBlueprint>;
