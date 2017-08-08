import { TypeOf } from "../util";
import { EntityType } from "../metadata";
import { IService } from "./service.type";
import { getServiceType } from "./service.decorator";

export type ResolveService = (type: TypeOf<IService>) => IService;

export class ServiceProvider {
    private _services = new Map<EntityType<any>, IService>();
    private _resolve: ResolveService = null;

    constructor(resolve: ResolveService) {
        this._resolve = resolve;
    }

    async get<T>(entityType: EntityType<T>): Promise<IService> {
        let service = this._services.get(entityType);

        if (!service) {
            let serviceType = getServiceType(entityType);

            if (!serviceType) {
                throw `no service for entity type ${entityType.name} found`;
            }

            service = this._resolve(serviceType);
            this._services.set(entityType, service);
        }

        return service;
    }
}
