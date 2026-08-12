import type {
  CompiledSceneObject,
  SemanticSnapshot,
} from "@knowledge-hub/lesson-compiler";

declare const safeMarkupBrand: unique symbol;

/** Markup a serializer in this package produced, with every value escaped. */
export type SafeMarkup = string & { readonly [safeMarkupBrand]: true };

export interface RenderedSnapshot {
  readonly markup: SafeMarkup;
  readonly description: string;
  readonly logicalWidth: number;
  readonly logicalHeight: number;
}

export interface RenderedStep extends RenderedSnapshot {
  readonly stepId: string;
  readonly stepNumber: number;
  readonly narration: string;
}

/**
 * Interactive figures carry per-object hooks the site controller swaps between
 * snapshots. Static steps carry none, so the Motion-Equivalent View stays inert.
 */
export type PrimitivePresentation = "interactive" | "static";

export interface ArrayGeometry {
  readonly cellCount: number;
  readonly cellWidth: number;
  readonly left: number;
  readonly top: number;
  readonly height: number;
}

export interface PrimitiveRenderContext {
  readonly snapshot: SemanticSnapshot;
  readonly presentation: PrimitivePresentation;
  /** The first array's band. Kept for primitives that need any array at all. */
  readonly geometry: ArrayGeometry;
  /** The band belonging to one array, by its object id. */
  readonly geometryFor: (objectId: string) => ArrayGeometry;
  readonly rowCount: number;
}

export interface PrimitiveContract {
  readonly kind: CompiledSceneObject["kind"];
  readonly accepts: (object: CompiledSceneObject) => boolean;
  readonly render: (
    object: CompiledSceneObject,
    context: PrimitiveRenderContext,
  ) => SafeMarkup;
  readonly describe: (
    object: CompiledSceneObject,
    context: PrimitiveRenderContext,
  ) => string;
}
