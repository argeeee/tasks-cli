# Project structure

```
project/
  src/
    injections.ts
    core/
    features/
      shared/
      <feature>/
        injections.ts
        application/
        data/
          mappers/
          models/
          repoQueries/
        domain/
          entities/
          failures/
          models/
          repoQueries/
          useCases/
```

## Domain components

The domain contains the feature's business concepts and rules. It should not depend on frameworks, databases, or other infrastructure.

### Entities: `domain/entities/`

Entities have stable identity and represent things the domain tracks.

```ts
// domain/entities/Entity.ts
export type Entity = {
  id: string;
  name: string;
};
```

### Models: `domain/models/`

Put all domain types that are **not entities** in `domain/models/`. Models include use-case inputs and other domain data shapes; they do not represent identity-bearing domain objects.

```ts
// domain/models/CreateEntityRequest.ts
export type CreateEntityRequest = {
  name: string;
};
```

### Failures: `domain/failures/`

Failures describe expected unsuccessful domain outcomes. A feature may define individual variants and combine them as a union.

```ts
// domain/failures/EntityFailure.ts
export type EntityFailure = {
  type: "entity-validation";
  message: string;
};
```

### Repository query contracts: `domain/repoQueries/`

These interfaces define the data operations needed by the domain, independently of how data is stored.

```ts
// domain/repoQueries/CreateEntityQuery.ts
import type { RepoQuery } from "../../../core";
import type { Entity } from "../entities/Entity";
import type { CreateEntityRequest } from "../models/CreateEntityRequest";

export interface CreateEntityQuery
  extends RepoQuery<CreateEntityRequest, Entity> {}
```

### Use cases: `domain/useCases/`

Use cases implement feature behavior and depend on domain contracts. They receive their dependencies through their constructor.

```ts
// domain/useCases/CreateEntity.ts
import { failure, success } from "../../../core";
import type { Result, UseCase } from "../../../core";
import type { Entity } from "../entities/Entity";
import type { EntityFailure } from "../failures/EntityFailure";
import type { CreateEntityRequest } from "../models/CreateEntityRequest";
import type { CreateEntityQuery } from "../repoQueries/CreateEntityQuery";

export class CreateEntity
  implements UseCase<CreateEntityRequest, Entity, EntityFailure>
{
  constructor(private readonly createEntityQuery: CreateEntityQuery) {}

  async execute(
    input: CreateEntityRequest,
  ): Promise<Result<Entity, EntityFailure>> {
    const name = input.name.trim();
    if (!name) {
      return failure({ type: "entity-validation", message: "name is required" });
    }

    return success(await this.createEntityQuery.query({ name }));
  }
}
```

The contract and implementation may throw for infrastructure errors; the use case can catch and map those into a typed failure, at the feature boundary.

## Data components

The data layer implements the domain's repository query contracts. It depends on domain types and contracts, while the domain remains independent of the data implementation.

### Query implementations: `data/repoQueries/`

An implementation chooses a storage mechanism and fulfills the domain contract. This example uses in-memory mock storage.

```ts
// data/repoQueries/CreateEntityQueryImpl.ts
import { randomUUID } from "node:crypto";
import type { Entity } from "../../domain/entities/Entity";
import type { CreateEntityRequest } from "../../domain/models/CreateEntityRequest";
import type { CreateEntityQuery } from "../../domain/repoQueries/CreateEntityQuery";
import { mockEntities } from "../mock/mockEntities";

export class CreateEntityQueryImpl implements CreateEntityQuery {
  async query(input: CreateEntityRequest): Promise<Entity> {
    const entity: Entity = { id: randomUUID(), ...input };
    mockEntities.push(entity);
    return entity;
  }
}
```

### Mappers: `data/mappers/`

Data mappers translate storage-specific records into domain entities, keeping persistence formats out of the domain. For a simple in-memory array, no mapper is needed; a database-backed implementation could use one:

```ts
// data/mappers/toEntity.ts
import type { Entity } from "../../domain/entities/Entity";

type EntityRecord = { entity_id: string; display_name: string };

export function toEntity(record: EntityRecord): Entity {
  return { id: record.entity_id, name: record.display_name };
}
```

### Data models: `data/models/`

Use this folder for persistence-specific types that are not domain entities, such as database row shapes. Do not put domain models here; those belong under `domain/models/`.

```ts
// data/models/EntityRecord.ts
export type EntityRecord = {
  entity_id: string;
  display_name: string;
};
```

## Dependency injection

`injections.ts` is the composition root: it constructs concrete data implementations, passes them into use cases, then passes use cases into their consumers. Keep feature-specific wiring in the feature; re-export it globally when application-level code needs one central entry point.

### Feature-local `injections.ts`

```ts
// features/entities/injections.ts
import { lazy } from "../../core";
import { CreateEntityQueryImpl } from "./data/repoQueries/CreateEntityQueryImpl";
import type { CreateEntityQuery } from "./domain/repoQueries/CreateEntityQuery";
import { CreateEntity } from "./domain/useCases/CreateEntity";

export const getCreateEntityQuery = lazy<CreateEntityQuery>(
  () => new CreateEntityQueryImpl(),
);

export const getCreateEntity = lazy(
  () => new CreateEntity(getCreateEntityQuery()),
);
```

Feature code can import from its local module:

```ts
import { getCreateEntity } from "../injections";

const createEntity = getCreateEntity();
```

### Global `src/injections.ts`

The global module is a barrel that re-exports feature-local factories. The dependency graph itself stays beside its feature.

```ts
// src/injections.ts
export * from "./features/entities/injections";
export * from "./features/other-feature/injections";
```

Application-level code can import through the global module:

```ts
import { getCreateEntity } from "./injections";

const createEntity = getCreateEntity();
```
