import { NotifyBuildStatus } from './interface/NotifyBuildStatus';
import { Building } from '@/game/gameobject/Building';
import { ObjectType } from '@/engine/type/ObjectType';
import { RadialBackFirstTileFinder } from '@/game/map/tileFinder/RadialBackFirstTileFinder';

export class FreeUnitTrait {
  [NotifyBuildStatus.onStatusChange](oldStatus: BuildStatus, building: Building, context: GameContext) {
    if (
      building.buildStatus === BuildStatus.Ready &&
      oldStatus === BuildStatus.BuildUp &&
      !building.owner.isNeutral
    ) {
      let unitRules;
      
      // 尝试获取载具单位规则
      if (context.rules.hasObject(building.rules.freeUnit, ObjectType.Vehicle)) {
        unitRules = context.rules.getObject(building.rules.freeUnit, ObjectType.Vehicle);
      } else {
        // 尝试获取步兵单位规则
        if (!context.rules.hasObject(building.rules.freeUnit, ObjectType.Infantry)) {
          console.warn(`Free unit "${building.rules.freeUnit}" is not a vehicle or infantry type.`);
          return;
        }
        unitRules = context.rules.getObject(building.rules.freeUnit, ObjectType.Infantry);
      }

      // 创建单位
      const unit = context.createUnitForPlayer(unitRules, building.owner);
      let fallbackTile: Tile | undefined;

      // 寻找合适的生成位置
      const spawnTile = new RadialBackFirstTileFinder(
        context.map.tiles,
        context.map.mapBounds,
        building.tile,
        building.getFoundation(),
        1,
        1,
        (tile) => {
          const isValidTile =
            context.map.terrain.getPassableSpeed(tile, unit.rules.speedType, unit.isInfantry(), false) > 0 &&
            Math.abs(tile.z - building.tile.z) < 2 &&
            !context.map.terrain.findObstacles({ tile, onBridge: undefined }, unit).length;

          if (!fallbackTile && isValidTile) {
            fallbackTile = tile;
          }

          return isValidTile && !context.map.getObjectsOnTile(tile).find(obj => obj.isOverlay());
        }
      ).getNextTile() ?? fallbackTile;

      // 如果没有找到合适的生成位置
      if (!spawnTile) {
        building.owner.removeOwnedObject(unit);
        unit.dispose();
        building.owner.credits += unit.purchaseValue;
        return;
      }

      // 在找到的位置生成单位
      context.spawnObject(unit, spawnTile);
    }
  }
}