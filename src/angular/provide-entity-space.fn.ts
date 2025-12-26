import { EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import { EntityServiceContainer, EntityWorkspace } from "@entity-space/execution";

export function provideEntitySpace(): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: EntityServiceContainer },
        {
            provide: EntityWorkspace,
            deps: [EntityServiceContainer],
            useFactory: (services: EntityServiceContainer) => new EntityWorkspace(services),
        },
    ]);
}
