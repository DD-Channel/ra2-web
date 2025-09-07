import { Renderer } from "@/engine/gfx/Renderer";
import { Engine } from "@/engine/Engine";
import { IsoCoords } from "@/engine/IsoCoords";
import { Player } from "@/game/Player";
import { WorldScene } from "@/engine/renderable/WorldScene";
import { Rules } from "@/game/rules/Rules";
import { MapGrid } from "@/engine/renderable/entity/map/MapGrid";
import { BoxedVar } from "@/util/BoxedVar";
import { UiAnimationLoop } from "@/engine/UiAnimationLoop";
import { ImageFinder } from "@/engine/ImageFinder";
import { Art } from "@/game/art/Art";
import { RenderableFactory } from "@/engine/renderable/entity/RenderableFactory";
import { TheaterType } from "@/engine/TheaterType";
import { Alliances } from "@/game/Alliances";
import { PlayerList } from "@/game/PlayerList";
import { SelectionLevel } from "@/game/gameobject/selection/SelectionLevel";
import { VeteranLevel } from "@/game/gameobject/unit/VeteranLevel";
import { PointerEvents } from "@/gui/PointerEvents";
import { CompositeDisposable } from "@/util/disposable/CompositeDisposable";
import { UnitSelection } from "@/game/gameobject/selection/UnitSelection";
import { CameraZoomControls } from "@/tools/CameraZoomControls";
import { Lighting } from "@/engine/Lighting";
import { ObjectFactory } from "@/game/gameobject/ObjectFactory";
import { TileCollection } from "@/game/map/TileCollection";
import { ObjectType } from "@/engine/type/ObjectType";
import { MoveState } from "@/game/gameobject/trait/MoveTrait";
import { TileOccupation } from "@/game/map/TileOccupation";
import { Bridges } from "@/game/map/Bridges";
import { RenderableManager } from "@/engine/RenderableManager";
import { World } from "@/game/World";
import { Strings } from "@/data/Strings";
import { MapBounds } from "@/game/map/MapBounds";
import { FlyerHelperMode } from "@/engine/renderable/entity/unit/FlyerHelperMode";
import { VxlBuilderFactory } from "@/engine/renderable/builder/VxlBuilderFactory";
import { VxlGeometryPool } from "@/engine/renderable/builder/vxlGeometry/VxlGeometryPool";
import { VxlGeometryCache } from "@/engine/gfx/geometry/VxlGeometryCache";
import { ShadowQuality } from "@/engine/renderable/entity/unit/ShadowQuality";
import { CanvasMetrics } from "@/gui/CanvasMetrics";
import { ZoneType } from "@/game/gameobject/unit/ZoneType";
import { LightingDirector } from "@/engine/gfx/lighting/LightingDirector";
import { rampHeights } from "@/game/theater/rampHeights";

declare const THREE: any;

export class VehicleTester {
  private static disposables = new CompositeDisposable();
  private static renderer: Renderer;
  private static theater: any;
  private static rules: Rules;
  private static art: Art;
  private static images: any;
  private static voxels: any;
  private static voxelAnims: any;
  private static uiAnimationLoop: UiAnimationLoop;
  private static worldScene: WorldScene;
  private static world: World;
  private static currentRenderable: any;
  private static currentVehicle: any;
  private static listEl: HTMLDivElement;
  private static controlsEl: HTMLDivElement | undefined;
  private static vxlGeometryPool: VxlGeometryPool;
  private static fixedDirection: number | undefined;
  private static animateTimer: number | undefined;

  static async main(_args: any): Promise<void> {
    const renderer = (this.renderer = new Renderer(800, 600));
    renderer.init(document.body);
    renderer.initStats(document.body);

    const worldScene = WorldScene.factory(
      { x: 0, y: 0, width: 800, height: 600 },
      new BoxedVar(true),
      new BoxedVar(ShadowQuality.High),
    );
    this.disposables.add(worldScene);
    (worldScene.scene.background as any) = new THREE.Color(12632256);

    IsoCoords.init({ x: 0, y: 0 });
    this.theater = await Engine.loadTheater(TheaterType.Temperate);

    const rules = new Rules(Engine.getRules());
    this.rules = rules;
    this.art = new Art(rules as any, Engine.getArt(), undefined as any, console);
    this.images = Engine.getImages();
    this.voxels = Engine.getVoxels();
    this.voxelAnims = Engine.getVoxelAnims();

    this.buildBrowser(rules["vehicleRules"] as Map<string, any>);

    const canvasMetrics = new CanvasMetrics(renderer.getCanvas(), window);
    canvasMetrics.init();
    this.disposables.add(() => canvasMetrics.dispose());

    const pointerEvents = new PointerEvents(renderer as any, { x: 0, y: 0 }, document, {
      get x() { return canvasMetrics.x; },
      get y() { return canvasMetrics.y; },
      get width() { return canvasMetrics.width; },
      get height() { return canvasMetrics.height; },
    } as any);
    const cameraZoomControls = new CameraZoomControls(pointerEvents, worldScene.cameraZoom);
    cameraZoomControls.init();
    this.disposables.add(pointerEvents, cameraZoomControls);

    renderer.addScene(worldScene);

    const uiAnimationLoop = (this.uiAnimationLoop = new UiAnimationLoop(renderer));
    uiAnimationLoop.start();
    this.worldScene = worldScene;

    this.vxlGeometryPool = new VxlGeometryPool(new VxlGeometryCache(null, null));

    this.addGrid();
    this.createFloor();
  }

  static addGrid(): void {
    const mapGrid = new MapGrid({ width: 10, height: 10 });
    const gridObject = mapGrid.get3DObject();
    const container = new THREE.Object3D();
    container.add(gridObject);
    this.worldScene.scene.add(container);
  }

  static createFloor(): void {
    const geometry = new THREE.PlaneGeometry(10000, 10000);
    const material = new THREE.ShadowMaterial();
    material.opacity = 0.5;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    mesh.renderOrder = 200000;
    mesh.position.y = 1;
    this.worldScene.scene.add(mesh);
  }

  static selectVehicle(vehicleType: string): void {
    if (this.currentVehicle && !this.currentVehicle.isDisposed) {
      this.world.removeObject(this.currentVehicle);
      this.currentVehicle.dispose();
    }

    const player = new Player("Player");
    this.disposables.add(player);
    const desiredColor = this.rules.getMultiplayerColors().get("DarkRed")!;
    (player as any).color = desiredColor;

    const playerList = new PlayerList();
    playerList.addPlayer(player);
    const alliances = new Alliances(playerList);
    const unitSelection = new UnitSelection();
    const lighting = new Lighting();
    this.disposables.add(lighting);

    const renderableFactory = new RenderableFactory(
      new BoxedVar(player) as any,
      unitSelection as any,
      alliances as any,
      this.rules as any,
      this.art as any,
      undefined as any,
      new ImageFinder(this.images, this.theater) as any,
      Engine.getPalettes() as any,
      this.voxels as any,
      this.voxelAnims as any,
      this.theater as any,
      this.worldScene.camera as any,
      new Lighting(),
      new LightingDirector(new Lighting().mapLighting, this.renderer as any, new BoxedVar(1) as any) as any,
      new BoxedVar(false) as any,
      new BoxedVar(false) as any,
      new BoxedVar(2) as any,
      undefined as any,
      new Strings() as any,
      new BoxedVar(FlyerHelperMode.Selected) as any,
      new BoxedVar(false) as any,
      new VxlBuilderFactory(this.vxlGeometryPool, false, this.worldScene.camera) as any,
      new Map() as any,
    );

    // Minimal 2x2 tile collection as ground for vehicle
    const tileCollection = new TileCollection(
      [
        { rx: 0, ry: 0, dx: 0, dy: 0, z: 0, tileNum: 0, subTile: 0 },
        { rx: 1, ry: 0, dx: 1, dy: 0, z: 0, tileNum: 0, subTile: 0 },
        { rx: 0, ry: 1, dx: 0, dy: 1, z: 0, tileNum: 0, subTile: 0 },
        { rx: 1, ry: 1, dx: 1, dy: 1, z: 0, tileNum: 0, subTile: 0 },
      ] as any,
      this.theater.tileSets as any,
      this.rules.general as any,
      () => 0
    );
    const tileOccupation = new TileOccupation(tileCollection);
    const mapBounds = new MapBounds();
    const bridges = new Bridges(this.theater.tileSets, tileCollection, tileOccupation, mapBounds, this.rules);

    const vehicle = (this.currentVehicle = new ObjectFactory(
      tileCollection,
      tileOccupation,
      bridges,
      new BoxedVar(1),
    ).create(ObjectType.Vehicle, vehicleType, this.rules as any, this.art as any));

    vehicle.owner = player;
    vehicle.position.tile = this.tile;

    const world = (this.world = new World());
    const renderableManager = new RenderableManager(world, this.worldScene, this.worldScene.camera, renderableFactory);
    renderableManager.init();
    this.disposables.add(renderableManager);
    world.spawnObject(vehicle);

    const renderable = (this.currentRenderable = renderableManager.getRenderableByGameObject(vehicle));
    renderable.selectionModel.setSelectionLevel(SelectionLevel.Selected);
    renderable.selectionModel.setControlGroupNumber(3);

    this.buildControls();
    this.startAutoAnimate();
  }

  private static startAutoAnimate(): void {
    if (this.animateTimer) {
      clearTimeout(this.animateTimer);
    }
    const step = () => {
      if (!this.currentVehicle) return;
      this.currentVehicle.direction = this.fixedDirection ?? ((this.currentVehicle.direction + 1) % 360);
      if (this.currentVehicle.turretTrait) {
        this.currentVehicle.turretTrait.facing = this.fixedDirection ?? ((this.currentVehicle.turretTrait.facing + 2) % 360);
      }
      this.animateTimer = window.setTimeout(step, 50);
    };
    this.animateTimer = window.setTimeout(step, 50);
  }

  static buildControls(): void {
    if (this.controlsEl) {
      document.body.removeChild(this.controlsEl);
    }
    const controls = (this.controlsEl = document.createElement("div"));
    controls.style.position = "absolute";
    controls.style.left = "0";
    controls.style.top = "0";
    controls.style.width = "200px";
    controls.style.padding = "5px";
    controls.style.background = "rgba(255, 255, 255, 0.5)";
    controls.style.border = "1px black solid";

    controls.appendChild(document.createTextNode("Remap color:"));
    const colorMap = new Map(this.rules.getMultiplayerColors());
    const colorSelect = document.createElement("select");
    colorSelect.style.display = "block";
    colorSelect.addEventListener("change", () => {
      this.currentVehicle.owner.color = colorMap.get(colorSelect.value);
    });
    controls.appendChild(colorSelect);
    colorMap.forEach((color, name) => {
      const option = document.createElement("option");
      option.innerHTML = name;
      option.value = name;
      option.selected = color.asHex() === this.currentVehicle.owner.color.asHex();
      colorSelect.appendChild(option);
    });

    controls.appendChild(document.createTextNode("Selection level:"));
    const selDiv = document.createElement("div");
    controls.appendChild(selDiv);
    [SelectionLevel.None, SelectionLevel.Hover, SelectionLevel.Selected].forEach((level) => {
      const btn = document.createElement("button");
      btn.innerHTML = SelectionLevel[level];
      btn.addEventListener("click", () => this.currentRenderable.selectionModel.setSelectionLevel(level));
      selDiv.appendChild(btn);
    });

    controls.appendChild(document.createTextNode("Veteran level:"));
    const vetDiv = document.createElement("div");
    controls.appendChild(vetDiv);
    if (this.currentVehicle.veteranTrait) {
      [VeteranLevel.None, VeteranLevel.Veteran, VeteranLevel.Elite].forEach((lvl) => {
        const btn = document.createElement("button");
        btn.innerHTML = VeteranLevel[lvl];
        btn.addEventListener("click", () => (this.currentVehicle.veteranTrait.veteranLevel = lvl));
        vetDiv.appendChild(btn);
      });
    }

    controls.appendChild(document.createTextNode("Ramp type:"));
    const rampSelect = document.createElement("select");
    rampSelect.style.display = "block";
    rampSelect.addEventListener("change", () => {
      this.tile.rampType = Number(rampSelect.value);
      this.currentVehicle.tilterTrait?.onTileChange?.(this.currentVehicle);
    });
    for (let i = 0; i < rampHeights.length; i++) {
      const opt = document.createElement("option");
      opt.innerHTML = String(i);
      opt.value = String(i);
      rampSelect.appendChild(opt);
    }
    controls.appendChild(rampSelect);

    controls.appendChild(document.createTextNode("Turret #:"));
    const turretSelect = document.createElement("select");
    turretSelect.style.display = "block";
    turretSelect.disabled = !this.currentVehicle.rules.turret;
    turretSelect.addEventListener("change", () => {
      this.currentVehicle.turretNo = Number(turretSelect.value);
    });
    for (let t = 0; t < (this.currentVehicle.rules.turretCount || 0); t++) {
      const opt = document.createElement("option");
      opt.innerHTML = String(t);
      opt.value = String(t);
      turretSelect.appendChild(opt);
    }
    controls.appendChild(turretSelect);

    controls.appendChild(document.createTextNode("isMoving:"));
    const moving = document.createElement("input");
    moving.type = "checkbox";
    moving.style.display = "block";
    moving.addEventListener("change", (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      this.currentVehicle.moveTrait.moveState = checked ? MoveState.Moving : MoveState.Idle;
      if (this.currentVehicle.rules.consideredAircraft && checked) {
        this.currentVehicle.zone = ZoneType.Air;
      } else {
        this.currentVehicle.zone = this.currentVehicle.rules.naval ? ZoneType.Water : ZoneType.Ground;
      }
    });
    controls.appendChild(moving);

    controls.appendChild(document.createTextNode("isFiring:"));
    const firing = document.createElement("input");
    firing.type = "checkbox";
    firing.style.display = "block";
    firing.addEventListener("change", (e) => {
      this.currentVehicle.isFiring = (e.target as HTMLInputElement).checked;
    });
    controls.appendChild(firing);

    controls.appendChild(document.createTextNode("isRocking:"));
    const rocking = document.createElement("input");
    rocking.type = "checkbox";
    rocking.style.display = "block";
    rocking.addEventListener("change", (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      if (checked) this.currentVehicle.applyRocking(360 * Math.random(), 1);
      else this.currentVehicle.rocking = undefined;
    });
    controls.appendChild(rocking);

    if (this.currentVehicle.airSpawnTrait) {
      controls.appendChild(document.createTextNode("hasSpawns:"));
      const hasSpawns = document.createElement("input");
      hasSpawns.type = "checkbox";
      hasSpawns.style.display = "block";
      hasSpawns.checked = !!this.currentVehicle.airSpawnTrait.availableSpawns;
      hasSpawns.addEventListener("change", (e) => {
        const v = (e.target as HTMLInputElement).checked ? 1 : 0;
        this.currentVehicle.airSpawnTrait.debugSetStorage(null, v);
      });
      controls.appendChild(hasSpawns);
    }

    controls.appendChild(document.createTextNode("Warped out:"));
    const warped = document.createElement("input");
    warped.type = "checkbox";
    warped.style.display = "block";
    warped.addEventListener("change", (e) => {
      this.currentVehicle.warpedOutTrait?.debugSetActive((e.target as HTMLInputElement).checked);
    });
    controls.appendChild(warped);

    controls.appendChild(document.createTextNode("Direction:"));
    const dirWrap = document.createElement("div");
    controls.appendChild(dirWrap);
    const dir = document.createElement("input");
    dir.type = "range";
    dir.min = "-180";
    dir.max = "180";
    dir.value = "0";
    dir.disabled = this.fixedDirection === undefined ? true : false;
    dir.style.verticalAlign = "middle";
    dir.addEventListener("input", () => {
      this.fixedDirection = Number(dir.value);
    });
    dirWrap.appendChild(dir);
    const reset = document.createElement("button");
    reset.innerHTML = "Reset";
    reset.disabled = this.fixedDirection === undefined;
    reset.style.verticalAlign = "middle";
    reset.addEventListener("click", () => {
      if (this.fixedDirection !== undefined) {
        this.fixedDirection = 0;
        dir.value = "0";
      }
    });
    dirWrap.appendChild(reset);
    const autoRotate = document.createElement("input");
    autoRotate.type = "checkbox";
    autoRotate.checked = this.fixedDirection === undefined;
    autoRotate.addEventListener("change", (e) => {
      this.fixedDirection = (e.target as HTMLInputElement).checked ? undefined : 0;
      const disabled = this.fixedDirection === undefined;
      dir.disabled = disabled;
      reset.disabled = disabled;
      dir.value = "0";
    });
    controls.appendChild(autoRotate);
    const autoLabel = document.createElement("label");
    autoLabel.innerHTML = "Auto rotate";
    controls.appendChild(autoLabel);

    const destroy = document.createElement("button");
    destroy.style.display = "block";
    destroy.style.color = "red";
    destroy.innerHTML = "DESTROY";
    destroy.addEventListener("click", async () => {
      this.currentVehicle.isDestroyed = true;
      this.world.removeObject(this.currentVehicle);
      this.currentVehicle.dispose();
      this.currentVehicle = undefined;
      document.body.removeChild(this.controlsEl!);
      this.controlsEl = undefined;
    });
    controls.appendChild(destroy);

    document.body.appendChild(controls);
  }

  static buildBrowser(vehicleRules: Map<string, any>): void {
    const list = (this.listEl = document.createElement("div"));
    list.style.position = "absolute";
    list.style.right = "0";
    list.style.top = "0";
    list.style.height = "600px";
    list.style.width = "200px";
    list.style.overflowY = "auto";
    list.style.padding = "5px";
    list.style.background = "rgba(255, 255, 255, 0.5)";
    list.style.border = "1px black solid";
    list.appendChild(document.createTextNode("Vehicle types:"));

    const types = [...vehicleRules.keys()]
      .filter((name) => this.art.hasObject(name, ObjectType.Vehicle))
      .sort();

    types.forEach((name) => {
      const link = document.createElement("a");
      link.style.display = "block";
      link.textContent = name;
      link.setAttribute("href", "javascript:;");
      link.addEventListener("click", () => {
        console.log("Selected vehicle", name);
        this.selectVehicle(name);
      });
      list.appendChild(link);
    });

    document.body.appendChild(list);
    setTimeout(() => {
      if (types.length) {
        this.selectVehicle(types[0]);
      }
    }, 50);
  }

  static destroy(): void {
    this.renderer?.dispose?.();
    this.uiAnimationLoop?.destroy?.();
    this.listEl?.remove?.();
    if (this.controlsEl) {
      this.controlsEl.remove();
      this.controlsEl = undefined;
    }
    if (this.animateTimer) {
      clearTimeout(this.animateTimer);
      this.animateTimer = undefined;
    }
    this.disposables.dispose();
  }

  private static tile: { rx: number; ry: number; z: number; rampType: number } = { rx: 1, ry: 1, z: 0, rampType: 0 };
}


