import { TypeOf } from "../util";
import { EntityType } from "../metadata";
import { getServiceType, Service } from "./service";

export type ResolveService = (type: TypeOf<Service>) => Service;

export class ServiceProvider {
    private _services = new Map<EntityType<any>, Service>();
    private _resolve: ResolveService = null;

    constructor(resolve: ResolveService) {
        this._resolve = resolve;
    }

    async get<T>(entityType: EntityType<T>): Promise<Service> {
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
