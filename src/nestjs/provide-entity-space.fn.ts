import { EntityServiceContainer, EntityWorkspace } from "@entity-space/execution";
import { Provider } from "@nestjs/common";

export function provideEntitySpace(): Provider[] {
    return [
        EntityServiceContainer,
        {
            provide: EntityWorkspace,
            inject: [EntityServiceContainer],
            useFactory: (services: EntityServiceContainer) => new EntityWorkspace(services),
        },
    ];
}
