import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import { asSafeMarkup } from "./escapeMarkup.js";
import type {
  PrimitiveContract,
  PrimitiveRenderContext,
  SafeMarkup,
} from "./types.js";

type SceneObjectOfKind<Kind extends CompiledSceneObject["kind"]> = Extract<
  CompiledSceneObject,
  { kind: Kind }
>;

interface PrimitiveBehavior<Kind extends CompiledSceneObject["kind"]> {
  readonly describe: (
    object: SceneObjectOfKind<Kind>,
    context: PrimitiveRenderContext,
  ) => string;
  readonly render: (
    object: SceneObjectOfKind<Kind>,
    context: PrimitiveRenderContext,
  ) => SafeMarkup;
}

/**
 * Builds a primitive contract over the whole scene-object union. It owns the
 * kind check and the visibility rule so no primitive repeats either.
 */
export function definePrimitive<Kind extends CompiledSceneObject["kind"]>(
  kind: Kind,
  behavior: PrimitiveBehavior<Kind>,
): PrimitiveContract {
  function accepts(
    object: CompiledSceneObject,
  ): object is SceneObjectOfKind<Kind> {
    return object.kind === kind;
  }

  return {
    accepts,
    describe: (object, context) =>
      accepts(object) ? behavior.describe(object, context) : "",
    kind,
    render: (object, context) =>
      accepts(object) && object.visible
        ? behavior.render(object, context)
        : asSafeMarkup(""),
  };
}
