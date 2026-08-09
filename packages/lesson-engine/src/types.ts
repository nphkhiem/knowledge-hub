export type PlaybackStatus = "idle" | "playing" | "paused" | "completed";

export interface EngineState {
  readonly lessonId: string;
  readonly stepIndex: number;
  readonly status: PlaybackStatus;
  readonly modelCheck: Readonly<{
    selectedOptionId: string | null;
    explanationRevealed: boolean;
  }>;
}

export type EngineCommand =
  | { readonly type: "play" }
  | { readonly type: "pause" }
  | { readonly type: "restart" }
  | { readonly type: "next" }
  | { readonly type: "previous" }
  | { readonly type: "seek"; readonly stepIndex: number }
  | {
      readonly type: "answer";
      readonly optionId: string;
      readonly revealExplanation: boolean;
    };
