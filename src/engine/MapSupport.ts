import { Rules } from "@/game/rules/Rules";
import { Engine } from "@/engine/Engine";
import { TileSets } from "@/game/theater/TileSets";
import { TheaterType } from "@/engine/TheaterType";
import { ObjectType } from "@/engine/type/ObjectType";

// Type definitions for the map and translator objects
interface Map {
  iniFormat: number;
  startingLocations: any[];
  theaterType: TheaterType;
  maxTileNum: number;
  maxOverlayId: string;
}

interface Translator {
  get(key: string, ...args: any[]): string;
}

interface WeaponData {
  projectile: string;
  warhead: string;
}

interface General {
  baseUnit: string[];
  harvesterUnit: string[];
  defaultMirageDisguises: string[];
  engineer: string;
  crew: {
    alliedCrew: string;
    sovietCrew: string;
  };
  alliedDisguise: string;
  sovietDisguise: string;
}

interface CrateRules {
  crateImg: string;
  waterCrateImg: string;
}

interface BuildingRule {
  undeploysInto?: string;
}

interface TechnoRule {
  spawns?: string;
  deploysInto?: string;
}

export class MapSupport {
  static check(map: Map, translator: Translator): string | undefined {
    // Check if map format is supported
    if (map.iniFormat < 4) {
      return translator.get("TS:MapUnsupportedGame");
    }

    // Check if map has enough starting locations
    if (map.startingLocations.length < 2) {
      return translator.get(
        "TXT_SCENARIO_TOO_SMALL",
        map.startingLocations.length
      );
    }

    // Check if theater type is supported
    if (!Engine.supportsTheater(map.theaterType)) {
      return translator.get(
        "TS:MapUnsupportedTheater",
        TheaterType[map.theaterType]
      );
    }

    // Get theater configuration and check tile sets
    const theaterIni = Engine.getTheaterIni(
      Engine.getActiveEngine(),
      map.theaterType
    );
    const tileSets = new TileSets(theaterIni);
    
    if (map.maxTileNum > tileSets.readMaxTileNum()) {
      return translator.get("TS:MapUnsupportedTileSet");
    }

    // Create rules instance and check overlay support
    const rules = new Rules(Engine.getRules().clone().mergeWith(map));
    
    if (!rules.hasOverlayId(map.maxOverlayId)) {
      return translator.get("TS:MapUnsupportedOverlay", map.maxOverlayId);
    }

    // Check weapon types
    for (const weaponType of rules.weaponTypes.values()) {
      if (!rules.getIni().getSection(weaponType)) {
        return translator.get("TS:MapUnsupportedWeapon", weaponType);
      }

      const weaponData: WeaponData = rules.getWeapon(weaponType);
      const projectile = weaponData.projectile;
      const warhead = weaponData.warhead;

      if (!projectile || !warhead) {
        return translator.get("TS:MapUnsupportedWeapon", weaponType);
      }

      if (!rules.getIni().getSection(projectile)) {
        return translator.get("TS:MapUnsupportedProjectile", projectile);
      }

      if (
        !rules.warheadRules.has(warhead.toLowerCase()) &&
        !rules.getIni().getSection(warhead)
      ) {
        return translator.get("TS:MapUnsupportedWarhead", warhead);
      }
    }

    // Check base and harvester units
    const general: General = rules.general;
    for (const unit of [...general.baseUnit, ...general.harvesterUnit]) {
      if (unit && !rules.hasObject(unit, ObjectType.Vehicle)) {
        return translator.get("TS:MapUnsupportedTechno", unit);
      }
    }

    // Check mirage disguises
    for (const disguise of general.defaultMirageDisguises) {
      if (disguise && !rules.terrainRules.has(disguise)) {
        return translator.get("TS:MapUnsupportedTerrain", disguise);
      }
    }

    // Check crew and disguise units
    const crewAndDisguiseUnits = [
      general.engineer,
      general.crew.alliedCrew,
      general.crew.sovietCrew,
      general.alliedDisguise,
      general.sovietDisguise,
    ];

    for (const unit of crewAndDisguiseUnits) {
      if (unit && !rules.infantryRules.has(unit)) {
        return translator.get("TS:MapUnsupportedTechno", unit);
      }
    }

    // Check crate images
    const crateRules: CrateRules = rules.crateRules;
    for (const crateImg of [crateRules.crateImg, crateRules.waterCrateImg]) {
      if (crateImg && !rules.overlayRules.has(crateImg)) {
        return translator.get("TS:MapUnsupportedOverlay", crateImg);
      }
    }

    // Check building undeploy targets
    for (const building of rules.buildingRules.values() as IterableIterator<BuildingRule>) {
      if (
        building.undeploysInto &&
        !rules.hasObject(building.undeploysInto, ObjectType.Vehicle)
      ) {
        return translator.get("TS:MapUnsupportedTechno", building.undeploysInto);
      }
    }

    // Check techno spawns and deploy targets
    const allTechnoRules = [
      ...rules.infantryRules.values(),
      ...rules.vehicleRules.values(),
      ...rules.aircraftRules.values(),
    ] as TechnoRule[];

    for (const techno of allTechnoRules) {
      if (techno.spawns && !rules.hasObject(techno.spawns, ObjectType.Aircraft)) {
        return translator.get("TS:MapUnsupportedTechno", techno.spawns);
      }

      if (
        techno.deploysInto &&
        !rules.hasObject(techno.deploysInto, ObjectType.Building)
      ) {
        return translator.get("TS:MapUnsupportedTechno", techno.deploysInto);
      }
    }

    // If all checks pass, return undefined (no error)
    return undefined;
  }
}