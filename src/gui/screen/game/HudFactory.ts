import { Hud } from 'gui/screen/game/component/Hud';
import { Engine } from 'engine/Engine';

/**
 * Factory for creating HUD instances with all required dependencies
 */
export class HudFactory {
  constructor(
    private sideType: any,
    private uiScene: any,
    private sidebarModel: any,
    private messageList: any,
    private chatHistory: any,
    private debugText: any,
    private debugTextEnabled: any,
    private localPlayer: any,
    private players: any,
    private stalemateDetectTrait: any,
    private countdownTimer: any,
    private cameoFilenames: any,
    private jsxRenderer: any,
    private strings: any,
    private commandBarButtons: any
  ) {}

  setSidebarModel(sidebarModel: any): void {
    this.sidebarModel = sidebarModel;
  }

  create(): Hud {
    return new Hud(
      this.sideType,
      this.uiScene.viewport,
      Engine.getImages(),
      Engine.getPalettes(),
      this.cameoFilenames,
      this.sidebarModel,
      this.messageList,
      this.chatHistory,
      this.debugText,
      this.debugTextEnabled,
      this.localPlayer,
      this.players,
      this.stalemateDetectTrait,
      this.countdownTimer,
      this.jsxRenderer,
      this.strings,
      this.commandBarButtons
    );
  }
}
