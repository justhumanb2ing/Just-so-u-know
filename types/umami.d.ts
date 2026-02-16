type UmamiTrackPayload = Record<string, unknown>;
type UmamiTrackPayloadFactory = (props: UmamiTrackPayload) => UmamiTrackPayload;

type UmamiTrackFunction = {
  (): void;
  (eventName: string, eventData?: UmamiTrackPayload): void;
  (payload: UmamiTrackPayload | UmamiTrackPayloadFactory): void;
};

type UmamiIdentifyFunction = {
  (uniqueId: string, data?: UmamiTrackPayload): void;
  (data: UmamiTrackPayload): void;
};

declare global {
  interface Window {
    umami?: {
      track: UmamiTrackFunction;
      identify: UmamiIdentifyFunction;
    };
  }
}

export {};
