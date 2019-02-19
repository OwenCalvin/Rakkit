import {
  ResolverClassMetadata,
  BaseResolverMetadata,
  MiddlewareMetadata,
  FieldResolverMetadata,
} from "./definitions";
import { ReflectMetadataMissingError } from "../errors";
import { isThrowing } from "../helpers/isThrowing";
import { MiddlewareType } from "../../../../types";

export function mapSuperResolverHandlers<T extends BaseResolverMetadata>(
  definitions: T[],
  superResolver: Function,
  resolverMetadata: ResolverClassMetadata,
): T[] {
  const superMetadata = definitions.filter(subscription => subscription.target === superResolver);

  return superMetadata.map<T>(metadata => ({
    ...(metadata as any),
    target: resolverMetadata.target,
    resolverClassMetadata: resolverMetadata,
  }));
}

export function mapSuperFieldResolverHandlers(
  definitions: FieldResolverMetadata[],
  superResolver: Function,
  resolverMetadata: ResolverClassMetadata,
): FieldResolverMetadata[] {
  const superMetadata = mapSuperResolverHandlers(definitions, superResolver, resolverMetadata);

  return superMetadata.map<FieldResolverMetadata>(metadata => ({
    ...metadata,
    getObjectType: isThrowing(metadata.getObjectType!)
      ? resolverMetadata.getObjectType!
      : metadata.getObjectType!,
  }));
}

export function mapMiddlewareMetadataToArray(
  metadata: MiddlewareMetadata[],
): MiddlewareType[] {
  return metadata
    .map(m => m.middlewares)
    .reduce<MiddlewareType[]>(
      (middlewares, resultArray) => resultArray.concat(middlewares),
      [],
    );
}

export function ensureReflectMetadataExists() {
  if (
    typeof Reflect !== "object" ||
    typeof Reflect.decorate !== "function" ||
    typeof Reflect.metadata !== "function"
  ) {
    throw new ReflectMetadataMissingError();
  }
}
