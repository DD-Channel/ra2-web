import { DeathType } from "@/game/gameobject/common/DeathType";
import { StanceType } from "@/game/gameobject/infantry/StanceType";
import { ZoneType } from "@/game/gameobject/unit/ZoneType";
import { CallbackTask } from "@/game/gameobject/task/system/CallbackTask";
import { ScatterTask } from "@/game/gameobject/task/ScatterTask";
import { BridgeOverlayTypes, OverlayBridgeType } from "@/game/map/BridgeOverlayTypes";
import { NotifyAttack } from "@/game/trait/interface/NotifyAttack";
import { ArmorType } from "@/game/type/ArmorType";
import { CollisionType } from "@/game/gameobject/unit/CollisionType";
import { RangeHelper } from "@/game/gameobject/unit/RangeHelper";
import { RadialTileFinder } from "@/game/map/tileFinder/RadialTileFinder";
import { Coords } from "@/game/Coords";
import * as MathUtils from "@/util/math";
import { FacingUtil } from "@/game/gameobject/unit/FacingUtil";
import { ObjectType } from "@/engine/type/ObjectType";
import { WarheadDetonateEvent } from "@/game/event/WarheadDetonateEvent";
import { WeaponType } from "@/game/WeaponType";
import { WeaponRules } from "@/game/rules/WeaponRules";
import { IniSection } from "@/data/IniSection";
import { ProjectileRules } from "@/game/rules/ProjectileRules";
import { AnimTerrainEffect } from "@/game/gameobject/common/AnimTerrainEffect";
import { ObjectAttackedEvent } from "@/game/event/ObjectAttackedEvent";

// Type definitions for game objects and interfaces
interface GameObject {
  isSpawned: boolean;
  isDisposed: boolean;
  isDestroyed: boolean;
  isCrashing: boolean;
  healthTrait?: HealthTrait;
  rules: GameObjectRules;
  position: Position;
  direction: number;
  owner: Player;
  name: string;
  zone?: ZoneType;
  overlayId?: number;
  tileElevation: number;
  onBridge?: boolean;
  
  isTechno(): boolean;
  isUnit(): boolean;
  isBuilding(): boolean;
  isInfantry(): boolean;
  isAircraft(): boolean;
  isVehicle(): boolean;
  isOverlay(): boolean;
  isTerrain(): boolean;
  isBridge(): boolean;
  onAttack(source: GameObject, weaponInfo?: WeaponInfo): void;
  applyRocking(direction: number, intensity: number): void;
  getBridge?(): GameObject;
}

interface TechnoObject extends GameObject {
  warpedOutTrait: WarpedOutTrait;
  invulnerableTrait: InvulnerableTrait;
  veteranTrait?: VeteranTrait;
  moveTrait: MoveTrait;
  unitOrderTrait: UnitOrderTrait;
  suppressionTrait?: SuppressionTrait;
  missileSpawnTrait?: MissileSpawnTrait;
  crashableTrait?: CrashableTrait;
  submergibleTrait?: SubmergibleTrait;
  delayedKillTrait?: DelayedKillTrait;
}

interface UnitObject extends TechnoObject {
  crateBonuses: CrateBonuses;
}

interface InfantryObject extends UnitObject {
  stance: StanceType;
  isPanicked: boolean;
  infDeathType: DeathType;
}

interface HealthTrait {
  health: number;
  getHitPoints(): number;
  inflictDamage(amount: number, weaponInfo?: WeaponInfo, gameWorld?: GameWorld): void;
  healBy(amount: number, healer: GameObject, gameWorld: GameWorld): void;
}

interface GameObjectRules {
  armor: ArmorType;
  warpable: boolean;
  immune: boolean;
  immuneToRadiation: boolean;
  immuneToPsionics: boolean;
  invisibleInGame: boolean;
  fraidycat: boolean;
  insignificant: boolean;
  typeImmune: boolean;
  wall: boolean;
}

interface WarheadRules {
  temporal: boolean;
  radiation: boolean;
  psychicDamage: boolean;
  proneDamage: number;
  verses: Map<ArmorType, number>;
  wallAbsoluteDestroyer: boolean;
  wall: boolean;
  wood: boolean;
  infDeath: DeathType;
  affectsAllies: boolean;
  causesDelayKill: boolean;
  delayKillAtMax: number;
  delayKillFrames: number;
  rocker: boolean;
  conventional: boolean;
  emEffect: boolean;
  animList: string[];
  name: string;
  cellSpread: number;
  percentAtMax: number;
  radLevel: number;
}

interface WeaponInfo {
  minRange: number;
  range: number;
  speed: number;
  type: WeaponType;
  rules: WeaponRules;
  projectileRules: ProjectileRules;
  warhead: Warhead;
  weapon?: WeaponRules;
  obj?: GameObject;
  player?: Player;
}

interface GameWorld {
  map: GameMap;
  alliances: AllianceManager;
  traits: TraitContainer;
  events: EventDispatcher;
  rules: GameRules;
  gameOpts: GameOptions;
  mapRadiationTrait: MapRadiationTrait;
  destroyObject(obj: GameObject, source?: WeaponInfo, cause?: any, isDirectHit?: boolean): void;
  generateRandomInt(min: number, max: number): number;
}

interface GameMap {
  tiles: Tile[][];
  mapBounds: Rectangle;
  tileOccupation: TileOccupation;
  getObjectsOnTile(tile: Position): GameObject[];
}

interface Player {
  isCombatant(): boolean;
}

interface Position {
  getMapPosition(): Vector3;
  clone(): Position;
  sub(other: Vector3): Position;
}

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Rectangle {
  width: number;
  height: number;
}

// Additional interface definitions...
interface WarpedOutTrait { isInvulnerable(): boolean; }
interface InvulnerableTrait { isActive(): boolean; }
interface VeteranTrait { getVeteranArmorMultiplier(): number; }
interface MoveTrait { 
  reservedPathNodes: PathNode[];
  isIdle(): boolean;
}
interface PathNode { tile: Position; }
interface UnitOrderTrait { 
  hasTasks(): boolean;
  addTask(task: any): void;
}
interface SuppressionTrait { 
  isSuppressed(): boolean;
  suppress(): void;
}
interface MissileSpawnTrait {}
interface CrashableTrait { 
  crash(source?: WeaponInfo): void;
}
interface SubmergibleTrait {}
interface DelayedKillTrait { 
  isActive(): boolean;
  activate(frames: number, weaponInfo: WeaponInfo): void;
}
interface CrateBonuses { armor: number; }
interface TraitContainer { filter(trait: any): any[]; }
interface EventDispatcher { dispatch(event: any): void; }
interface GameRules { 
  audioVisual: AudioVisualRules;
  combatDamage: CombatDamageRules;
}
interface AudioVisualRules { 
  weaponNullifyAnim: string;
  weatherConBoltExplosion: string;
}
interface CombatDamageRules { 
  splashList: string[];
  c4Warhead: string;
}
interface GameOptions { destroyableBridges: boolean; }
interface MapRadiationTrait { 
  createRadSite(position: Position, level: number, radius: number): void;
}
interface AllianceManager { 
  areAllied(player1: Player, player2: Player): boolean;
}
interface Tile {}
interface TileOccupation {}

export class Warhead {
  static readonly SPECIAL_WARHEAD_NAME = "Special";
  static readonly HE_WARHEAD_NAME = "HE";

  constructor(private rules: WarheadRules) {}

  canDamage(obj: GameObject, tile: Position, zone: ZoneType): boolean {
    // Check if object is spawned and not disposed/destroyed/crashing
    if (!obj.isSpawned || obj.isDisposed || obj.isDestroyed || obj.isCrashing) {
      return false;
    }

    // Check temporal invulnerability
    if (obj.isTechno() && (obj as TechnoObject).warpedOutTrait.isInvulnerable() && !this.rules.temporal) {
      return false;
    }

    // Check unit path reservation
    if (obj.isUnit()) {
      const unitObj = obj as UnitObject;
      if (unitObj.moveTrait.reservedPathNodes.find(node => node.tile === tile)) {
        return false;
      }
    }

    // Must have health trait
    if (!obj.healthTrait) {
      return false;
    }

    // Air zone restrictions
    if (obj.isUnit() && obj.zone === ZoneType.Air && zone !== ZoneType.Air) {
      return false;
    }
    if (!obj.isUnit() && zone === ZoneType.Air) {
      return false;
    }

    // Building visibility check
    if (obj.isBuilding() && obj.rules.invisibleInGame) {
      return false;
    }

    // Immunity checks
    if ((obj.isTechno() || obj.isTerrain()) && obj.rules.immune && !this.rules.temporal) {
      return false;
    }
    if (obj.isTechno() && !obj.rules.warpable && this.rules.temporal) {
      return false;
    }

    // Radiation immunity
    if (this.rules.radiation && (!obj.isUnit() || obj.rules.immuneToRadiation)) {
      return false;
    }

    // Psychic damage immunity
    if (this.rules.psychicDamage && (!obj.isUnit() || obj.rules.immuneToPsionics)) {
      return false;
    }

    // Bridge overlay check
    if (obj.isOverlay() && BridgeOverlayTypes.isLowBridgeHead(obj.overlayId!)) {
      return false;
    }

    return true;
  }

  computeDamage(baseDamage: number, target: GameObject, gameWorld: GameWorld, isWeatherStorm = false): number {
    let damage = baseDamage;

    // No damage if base damage is positive and target has active invulnerability
    if (damage > 0 && target.isTechno() && (target as TechnoObject).invulnerableTrait.isActive()) {
      return 0;
    }

    // Aircraft with missile spawn trait not in air
    if (target.isAircraft()) {
      const aircraft = target as TechnoObject;
      if (aircraft.missileSpawnTrait && target.zone !== ZoneType.Air) {
        return 0;
      }
    }

    // Indestructible bridges
    if (!gameWorld.gameOpts.destroyableBridges && target.isOverlay() && target.isBridge()) {
      return 0;
    }

    // Prone infantry damage modification
    if (!this.rules.radiation && !this.rules.temporal && target.isInfantry()) {
      const infantry = target as InfantryObject;
      if (infantry.stance === StanceType.Prone) {
        damage *= this.rules.proneDamage;
      }
    }

    // Armor calculation for techno/overlay/terrain objects
    if (target.isTechno() || target.isOverlay() || target.isTerrain()) {
      let armorType = target.isTerrain() ? ArmorType.Wood : target.rules.armor;

      // Bridge armor type override
      if (target.isOverlay() && target.isBridge()) {
        const bridgeType = BridgeOverlayTypes.getOverlayBridgeType(target.overlayId!);
        if (bridgeType === OverlayBridgeType.Wood) {
          armorType = ArmorType.Wood;
        } else if (bridgeType === OverlayBridgeType.Concrete) {
          armorType = ArmorType.Concrete;
        }
      }

      // Apply verses multiplier (except for weather storm on walls/bridges)
      if (!(isWeatherStorm && target.isOverlay() && (target.isBridge() || target.rules.wall))) {
        damage *= this.rules.verses.get(armorType) || 1;
      }

      // Veteran armor bonus
      if (damage > 0 && target.isTechno()) {
        const techno = target as TechnoObject;
        if (techno.veteranTrait) {
          damage /= techno.veteranTrait.getVeteranArmorMultiplier();
        }
      }

      // Crate armor bonus for units
      if (damage > 0 && target.isUnit()) {
        const unit = target as UnitObject;
        damage /= unit.crateBonuses.armor;
      }
    }

    // Wall destruction logic
    if ((target.isOverlay() || target.isBuilding()) && target.rules.wall) {
      if (this.rules.wallAbsoluteDestroyer) {
        damage = Number.POSITIVE_INFINITY;
      } else if (!this.rules.wall && !(this.rules.wood && target.rules.armor === ArmorType.Wood)) {
        damage = 0;
      }
    }

    // Bridge destruction
    if (target.isOverlay() && target.isBridge() && !this.rules.wall) {
      damage = 0;
    }

    // Floor positive damage, ceil negative damage
    return damage > 0 ? Math.floor(damage) : Math.ceil(damage);
  }

  inflictDamage(damage: number, target: GameObject, weaponInfo: WeaponInfo | undefined, gameWorld: GameWorld, isDirectHit = false): boolean {
    const healthTrait = target.healthTrait!;

    // Convert infinite damage to current hit points
    if (damage === Number.POSITIVE_INFINITY) {
      damage = healthTrait.getHitPoints();
    }

    // Apply damage
    healthTrait.inflictDamage(damage, weaponInfo, gameWorld);

    // Notify attack traits
    gameWorld.traits.filter(NotifyAttack).forEach((trait: any) => {
      trait[NotifyAttack.onAttack](target, weaponInfo?.obj, gameWorld);
    });

    // Object's onAttack callback
    target.onAttack(gameWorld, weaponInfo);

    // Dispatch attack event
    gameWorld.events.dispatch(new ObjectAttackedEvent(target, weaponInfo, isDirectHit));

    // Suppression/scatter for techno objects
    if (target.isTechno() && !this.rules.temporal) {
      this.suppressOrScatterTarget(target as TechnoObject, gameWorld);
    }

    // Handle object destruction
    if (!healthTrait.health) {
      // Set infantry death type
      if (target.isInfantry()) {
        (target as InfantryObject).infDeathType = this.rules.infDeath;
      }

      // Set temporal death type
      if (this.rules.temporal) {
        target.deathType = DeathType.Temporal;
      }

      // Handle aircraft crashing
      if (target.isUnit() && (target as TechnoObject).crashableTrait && target.zone === ZoneType.Air && !this.rules.temporal) {
        (target as TechnoObject).crashableTrait!.crash(weaponInfo);
      } else {
        gameWorld.destroyObject(target, weaponInfo, undefined, isDirectHit);
      }

      return true;
    }

    return false;
  }

  private suppressOrScatterTarget(target: TechnoObject, gameWorld: GameWorld): void {
    if (target.rules.fraidycat || (target.isVehicle() && !target.owner.isCombatant() && target.rules.insignificant)) {
      if (!target.unitOrderTrait.hasTasks()) {
        // Panic infantry
        if (target.isInfantry()) {
          (target as InfantryObject).isPanicked = true;
        }

        // Add scatter task
        target.unitOrderTrait.addTask(new ScatterTask(gameWorld));

        // Add callback to remove panic
        if (target.isInfantry()) {
          target.unitOrderTrait.addTask(
            new CallbackTask(() => (target as InfantryObject).isPanicked = false).setCancellable(false)
          );
        }
      }
    } else if (target.isInfantry()) {
      const infantry = target as InfantryObject;
      if ((infantry.moveTrait.isIdle() || infantry.suppressionTrait?.isSuppressed()) && infantry.suppressionTrait) {
        infantry.suppressionTrait.suppress();
      }
    }
  }

  createDummyWeaponInfo(): WeaponInfo {
    return {
      minRange: 0,
      range: 0,
      speed: Number.POSITIVE_INFINITY,
      type: WeaponType.Primary,
      rules: new WeaponRules(new IniSection("Dummy")),
      projectileRules: new ProjectileRules(ObjectType.Projectile, new IniSection("Dummy")),
      warhead: this
    };
  }

  detonate(
    gameWorld: GameWorld,
    baseDamage: number,
    centerTile: Position,
    elevation: number,
    centerCoords: Vector3,
    zone: ZoneType,
    collisionType: CollisionType | undefined,
    target: { obj?: GameObject; getBridge?(): GameObject },
    weaponInfo: WeaponInfo | undefined,
    friendly: boolean,
    areaEffectSmudge: string | undefined,
    customSpread?: number,
    isWeatherStorm = false
  ): void {
    const weapon = weaponInfo?.weapon ?? this.createDummyWeaponInfo();
    const sourceObj = weaponInfo?.obj;
    const sourcePlayer = weaponInfo?.player;
    const cellSpread = customSpread ? customSpread / Coords.LEPTONS_PER_TILE : this.rules.cellSpread;
    const percentAtMax = this.rules.percentAtMax;

    const processedObjects = new Set<GameObject>();
    const objectDistances = new Map<GameObject, number[]>();
    const rangeHelper = new RangeHelper(gameWorld.map.tileOccupation);
    const tileFinder = new RadialTileFinder(
      gameWorld.map.tiles,
      gameWorld.map.mapBounds,
      centerTile,
      { width: 1, height: 1 },
      0,
      Math.ceil(cellSpread),
      () => true
    );

    // Find all objects in range
    let currentTile: Position | null;
    while ((currentTile = tileFinder.getNextTile())) {
      for (const obj of gameWorld.map.getObjectsOnTile(currentTile)) {
        // Skip if already processed (except buildings which can be hit multiple times)
        if (processedObjects.has(obj) && !obj.isBuilding()) continue;

        // Skip units under bridge if collision type is UnderBridge
        if (collisionType === CollisionType.UnderBridge && obj.isUnit() && (obj as UnitObject).onBridge) continue;

        // Skip type immune objects from same owner
        if (sourceObj && obj.isTechno() && obj.rules.typeImmune && obj.owner === sourcePlayer && obj.name === sourceObj.name) continue;

        // Check if object can be damaged
        if (!this.canDamage(obj, currentTile, zone)) continue;

        // Skip overlays with elevation/bridge mismatches
        if (obj.isOverlay()) {
          if ((!collisionType && Math.abs(obj.tileElevation - elevation) > 0.1) ||
              (collisionType === CollisionType.OnBridge && !obj.isBridge())) {
            continue;
          }
        }

        // Calculate distance
        let distance: number;
        if (obj.isBuilding()) {
          distance = currentTile === centerTile ? 0 : rangeHelper.distance3(currentTile, centerCoords) / Coords.LEPTONS_PER_TILE;
        } else if (obj.isTerrain() || obj.isOverlay()) {
          distance = rangeHelper.distance3(currentTile, centerTile) / Coords.LEPTONS_PER_TILE;
        } else {
          distance = rangeHelper.distance3(obj, centerCoords) / Coords.LEPTONS_PER_TILE;
        }

        if (distance < 0.001) distance = 0;

        // Friendly fire check
        if (friendly && obj.isInfantry() && sourcePlayer) {
          if (obj.owner === sourcePlayer || gameWorld.alliances.areAllied(obj.owner, sourcePlayer)) {
            continue;
          }
        }

        // Range checks for zero spread
        if (!cellSpread) {
          if (obj.isTerrain()) {
            if (currentTile !== centerTile || !this.rules.wall) continue;
          } else if (!friendly && (currentTile !== centerTile || (!obj.isBuilding() && obj !== (target.obj || target.getBridge?.())))) {
            continue;
          }
        }

        // Skip if outside spread range
        if (cellSpread && distance > cellSpread) continue;

        processedObjects.add(obj);
        const distances = obj.isBuilding() ? (objectDistances.get(obj) || []).concat(distance) : [distance];
        objectDistances.set(obj, distances);
      }
    }

    let hasInvulnerableHit = false;
    let directHitTarget: GameObject | undefined;

    // Process damage for each object
    for (const obj of processedObjects) {
      if (obj.isDestroyed || obj.isCrashing) continue;

      let damage = this.computeDamage(baseDamage, obj, gameWorld, isWeatherStorm);

      // Allied damage negation
      if (baseDamage > 0 && !this.rules.affectsAllies && obj.isTechno() && sourcePlayer) {
        if (gameWorld.alliances.areAllied(obj.owner, sourcePlayer) || obj.owner === sourcePlayer) {
          damage = 0;
        }
      }

      if (!damage) continue;

      // Process each distance for this object
      for (const distance of objectDistances.get(obj)!) {
        let finalDamage = damage;

        // Apply distance falloff
        if (cellSpread > 0 && Number.isFinite(finalDamage)) {
          finalDamage = MathUtils.lerp(finalDamage, percentAtMax * finalDamage, distance / cellSpread);
        }

        // Minimum damage threshold
        if (Math.abs(finalDamage) < 1 && (!cellSpread || finalDamage / damage >= 0.25)) {
          finalDamage = Math.sign(finalDamage);
        }

        finalDamage = finalDamage > 0 ? Math.floor(finalDamage) : Math.ceil(finalDamage);
        if (!finalDamage) continue;

        const healthTrait = obj.healthTrait!;

        if (finalDamage < 0) {
          // Healing
          if (!sourceObj) throw new Error("Expected healer object to be set");
          healthTrait.healBy(-finalDamage, sourceObj, gameWorld);
          if (healthTrait.health === 100) break;
        } else {
          // Damage
          if (obj === target.obj && distance < 1) {
            directHitTarget = obj;
          }

          // Delayed kill for buildings
          if (this.rules.causesDelayKill && obj.isBuilding() && (obj as any).delayedKillTrait) {
            const currentHP = healthTrait.getHitPoints();
            if (finalDamage >= currentHP) {
              finalDamage = currentHP - 1;
              const delayedKill = (obj as any).delayedKillTrait;
              if (!delayedKill.isActive()) {
                const maxDelay = this.rules.delayKillAtMax;
                let delayFrames = this.rules.delayKillFrames;
                delayFrames = MathUtils.lerp(delayFrames, maxDelay * delayFrames, distance / cellSpread);
                delayedKill.activate(delayFrames, weaponInfo);
              }
            }
          }

          if (this.inflictDamage(finalDamage, obj, weaponInfo, gameWorld, !directHitTarget)) {
            break;
          }

          // Rocking effect for vehicles
          if (obj.isVehicle() && this.rules.rocker) {
            const rockIntensity = MathUtils.clamp(damage / 300, 0, 1);
            if (rockIntensity > 0) {
              const rockDirection = FacingUtil.fromMapCoords(
                obj.position.getMapPosition().clone().sub(Coords.vecWorldToGround(centerCoords))
              ) - obj.direction;
              obj.applyRocking(rockDirection, rockIntensity);
            }
          }
        }
      }

      // Track invulnerable hits
      if (obj.isTechno() && (obj as TechnoObject).invulnerableTrait.isActive()) {
        hasInvulnerableHit = true;
      }
    }

    // Radiation site creation
    const radLevel = weapon.rules.radLevel;
    if (radLevel && cellSpread) {
      gameWorld.mapRadiationTrait.createRadSite(centerTile, radLevel, cellSpread + 1);
    }

    // Animation selection
    const animation = isWeatherStorm ? undefined : 
      hasInvulnerableHit ? gameWorld.rules.audioVisual.weaponNullifyAnim :
      this.pickExplodeAnim(baseDamage, directHitTarget, zone, gameWorld, isWeatherStorm);

    // Terrain effects for ground impacts
    if (!hasInvulnerableHit && zone === ZoneType.Ground) {
      const terrainEffect = new AnimTerrainEffect();
      if (animation) terrainEffect.destroyOre(animation, centerTile, gameWorld);
      if (areaEffectSmudge) terrainEffect.spawnSmudges(areaEffectSmudge, centerTile, gameWorld);
      if (animation) terrainEffect.spawnSmudges(animation, centerTile, gameWorld);
    }

    // Dispatch detonation event
    gameWorld.events.dispatch(new WarheadDetonateEvent(this, centerCoords, animation, isWeatherStorm));
  }

  private pickExplodeAnim(damage: number, directHitTarget: GameObject | undefined, zone: ZoneType, gameWorld: GameWorld, isWeatherStorm: boolean): string | undefined {
    if (!damage) return undefined;

    if (isWeatherStorm) {
      return gameWorld.rules.audioVisual.weatherConBoltExplosion;
    }

    // Water splash animations
    if (this.rules.conventional && zone === ZoneType.Water) {
      if (!directHitTarget || directHitTarget.isBuilding() || 
          (directHitTarget.isVehicle() && (directHitTarget as TechnoObject).submergibleTrait)) {
        const splashList = gameWorld.rules.combatDamage.splashList;
        const index = MathUtils.clamp(Math.floor(damage / 50), 0, splashList.length - 1);
        return splashList[index];
      }
    }

    // Regular explosion animations
    const animCount = this.rules.animList.length;
    if (!animCount) return undefined;

    let animIndex: number;
    if (gameWorld.rules.combatDamage.c4Warhead === this.rules.name) {
      animIndex = animCount - 1;
    } else if (this.rules.emEffect) {
      animIndex = gameWorld.generateRandomInt(0, animCount - 1);
    } else {
      animIndex = MathUtils.clamp(Math.floor(damage / 25), 0, animCount - 1);
    }

    return this.rules.animList[animIndex];
  }
}