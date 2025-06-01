import { Renderer } from "@/engine/gfx/Renderer";
import { Engine } from "@/engine/Engine";
import { UiScene } from "@/gui/UiScene";
import { LobbyType, SlotType, SlotOccupation, PlayerStatus } from "@/gui/screen/mainMenu/lobby/component/viewmodel/lobby";
import { MainMenu } from "@/gui/screen/mainMenu/component/MainMenu";
import { Rules } from "@/game/rules/Rules";
import { LobbyForm } from "@/gui/screen/mainMenu/lobby/component/LobbyForm";
import { UiAnimationLoop } from "@/engine/UiAnimationLoop";
import { JsxRenderer } from "@/gui/jsx/JsxRenderer";
import { CompositeDisposable } from "@/util/disposable/CompositeDisposable";
import { jsx } from "@/gui/jsx/jsx";
import { HtmlView } from "@/gui/jsx/HtmlView";
import { aiUiNames, RANDOM_START_POS, NO_TEAM_ID } from "@/game/gameopts/constants";
import { PlayerRankType } from "@/network/ladder/PlayerRankType";
import { LadderType } from "@/network/ladder/wladderConfig";
import { ShpBuilder } from '@/engine/renderable/builder/ShpBuilder';
import { TextureUtils } from '@/engine/gfx/TextureUtils.js';

interface PlayerProfile {
  name: string;
  rank: number;
  rankType: PlayerRankType;
  points: number;
  ladder: {
    id: number;
    name: string;
    divisionName: string;
    type: LadderType;
  };
  wins: number;
  losses: number;
}

interface PlayerSlot {
  name?: string;
  type: SlotType;
  occupation: SlotOccupation;
  country: string;
  color: string;
  startPos: number;
  team: number;
  status: PlayerStatus;
  ping?: number;
  playerProfile?: PlayerProfile;
}

interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class LobbyFormTester {
  private static disposables = new CompositeDisposable();
  private static homeButton?: HTMLButtonElement;

  static main(container: HTMLElement, strings: any): void {
    const renderer = new Renderer(800, 600);
    renderer.init(container);
    renderer.initStats(document.body);
    this.disposables.add(renderer);

    const uiScene = UiScene.factory({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    });
    this.disposables.add(uiScene);

    const sceneWidth = 800;
    const sceneHeight = 600;
    const bounds: ViewportBounds = {
      x: Math.max(0, (uiScene.viewport.width - sceneWidth) / 2),
      y: Math.max(0, (uiScene.viewport.height - sceneHeight) / 2),
      width: sceneWidth,
      height: sceneHeight,
    };

    const jsxRenderer = new JsxRenderer(
      Engine.getImages(),
      Engine.getPalettes(),
      uiScene.getCamera(),
      undefined
    );

    const mainMenu = new MainMenu(bounds, Engine.getImages(), jsxRenderer, "dummy.webm");
    uiScene.add(mainMenu);

    const rules = new Rules(Engine.getRules());

    const [htmlElement] = jsxRenderer.render(
      jsx(HtmlView, {
        x: bounds.x,
        y: bounds.y,
        component: LobbyForm,
        props: {
          strings,
          countryUiNames: new Map([
            ["Random", "GUI:RandomEx"],
            ["Observer", "GUI:Observer"],
            ...rules.getMultiplayerCountries().map(country => [country.name, country.uiName] as [string, string])
          ]),
          countryUiTooltips: new Map<string, string>(),
          availablePlayerCountries: [
            "Random",
            ...rules.getMultiplayerCountries().map(country => country.name)
          ],
          availablePlayerColors: [
            "",
            ...[...rules.getMultiplayerColors().values()].map(color => color.asHexString())
          ],
          maxTeams: 4,
          availableAiNames: aiUiNames,
          availableStartPositions: new Array(8).fill(0).map((_, index) => index),
          activeSlotIndex: 0,
          teamsAllowed: true,
          teamsRequired: false,
          lobbyType: LobbyType.MultiplayerHost,
          playerSlots: [
            {
              name: "Player 1",
              type: SlotType.Player,
              occupation: SlotOccupation.Occupied,
              country: "French",
              color: "#2269d4",
              startPos: RANDOM_START_POS,
              team: NO_TEAM_ID,
              status: PlayerStatus.Host,
              ping: 50,
              playerProfile: {
                name: "Player 1",
                rank: 2,
                rankType: PlayerRankType.Private,
                points: 100,
                ladder: {
                  id: 0,
                  name: "1v1",
                  divisionName: "Test ladder",
                  type: LadderType.Solo1v1,
                },
                wins: 0,
                losses: 0,
              },
            },
            {
              name: "Player 2",
              type: SlotType.Player,
              occupation: SlotOccupation.Occupied,
              country: "Russians",
              color: "#ff1818",
              startPos: 1,
              team: 0,
              status: PlayerStatus.Ready,
              ping: 300,
            },
            {
              name: "Open",
              type: SlotType.Player,
              occupation: SlotOccupation.Open,
              country: "Random",
              color: "",
              startPos: RANDOM_START_POS,
              team: NO_TEAM_ID,
              status: PlayerStatus.NotReady,
            },
            {
              type: SlotType.Observer,
              occupation: SlotOccupation.Open,
              country: "Observer",
              color: "",
              startPos: RANDOM_START_POS,
              team: NO_TEAM_ID,
              status: PlayerStatus.NotReady,
            },
          ] as PlayerSlot[],
          shortGame: true,
          mcvRepacks: true,
          cratesAppear: true,
          superWeapons: true,
          buildOffAlly: true,
          destroyableBridges: true,
          multiEngineer: false,
          multiEngineerCount: 3,
          noDogEngiKills: false,
          gameSpeed: 6,
          credits: 10000,
          unitCount: 10,
          messages: [],
          mpDialogSettings: rules.mpDialogSettings,
          onSendMessage: () => {},
          onCountrySelect: (country: string) => {
            console.log("selected country", country);
          },
          onColorSelect: (color: string) => {
            console.log("selected color", color);
          },
          onStartPosSelect: (position: number) => {
            console.log("selected start pos", position);
          },
          onTeamSelect: (team: number) => {
            console.log("selected team", team);
          },
          onSlotChange: (slotIndex: number, slotType: SlotType) => {
            console.log("changed slot", slotIndex, slotType);
          },
          onToggleShortGame: (enabled: boolean) => console.log(enabled),
          onToggleMcvRepacks: (enabled: boolean) => console.log(enabled),
          onToggleCratesAppear: (enabled: boolean) => console.log(enabled),
          onToggleSuperWeapons: (enabled: boolean) => console.log(enabled),
          onToggleBuildOffAlly: (enabled: boolean) => console.log(enabled),
          onChangeGameSpeed: (speed: number) => console.log(speed),
          onChangeCredits: (credits: number) => console.log(credits),
          onChangeUnitCount: (count: number) => console.log(count),
        },
      })
    );

    mainMenu.add(htmlElement);
    renderer.addScene(uiScene);

    const animationLoop = new UiAnimationLoop(renderer);
    animationLoop.start();
    this.disposables.add(animationLoop);

    container.appendChild(uiScene.getHtmlContainer().getElement());
    this.disposables.add(() =>
      container.removeChild(uiScene.getHtmlContainer().getElement())
    );

    // Build home button to return to selection page
    this.buildHomeButton(container);
  }

  private static buildHomeButton(parent: HTMLElement): void {
    const homeButton = this.homeButton = document.createElement('button');
    homeButton.innerHTML = '← 主页';
    homeButton.style.cssText = `
      position: absolute;
      left: 10px;
      top: 10px;
      padding: 8px 16px;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      z-index: 1000;
      transition: background-color 0.2s;
    `;
    homeButton.onmouseover = () => {
      homeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    };
    homeButton.onmouseout = () => {
      homeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    };
    homeButton.onclick = () => {
      window.location.hash = '/';
    };
    parent.appendChild(homeButton);
    this.disposables.add(() => homeButton.remove());
  }

  static destroy(): void {
    this.disposables.dispose();
    if (this.homeButton) {
      this.homeButton.remove();
      this.homeButton = undefined;
    }

    // 清理可能导致纹理失效的全局缓存，避免返回主界面后贴图变黑
    try {
      // ShpBuilder 缓存
      if (ShpBuilder?.clearCaches) {
        ShpBuilder.clearCaches();
      }
      // TextureUtils 静态缓存
      if (TextureUtils?.cache) {
        TextureUtils.cache.forEach((tex: any) => tex.dispose?.());
        TextureUtils.cache.clear();
      }
    } catch (err) {
      console.warn('[LobbyFormTester] Failed to clear caches during destroy:', err);
    }
  }
}