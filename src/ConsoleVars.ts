import { BoxedVar } from './util/BoxedVar';

export class ConsoleVars {
  public readonly debugWireframes: BoxedVar<boolean>;
  public readonly debugPaths: BoxedVar<boolean>;
  public readonly debugText: BoxedVar<boolean>;
  public readonly debugBotIndex: BoxedVar<number>;
  public readonly debugLogging: BoxedVar<boolean>;
  public readonly forceResolution: BoxedVar<string | undefined>;
  public readonly freeCamera: BoxedVar<boolean>;
  public readonly fps: BoxedVar<boolean>;
  public readonly cheatsEnabled: BoxedVar<boolean>;

  constructor() {
    this.debugWireframes = new BoxedVar<boolean>(false);
    this.debugPaths = new BoxedVar<boolean>(false);
    this.debugText = new BoxedVar<boolean>(false);
    this.debugBotIndex = new BoxedVar<number>(0);
    this.debugLogging = new BoxedVar<boolean>(false);
    this.forceResolution = new BoxedVar<string | undefined>(undefined);
    this.freeCamera = new BoxedVar<boolean>(false);
    this.fps = new BoxedVar<boolean>(false);
    this.cheatsEnabled = new BoxedVar<boolean>(false);
  }
} 