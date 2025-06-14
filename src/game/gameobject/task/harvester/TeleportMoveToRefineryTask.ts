import { MoveTask } from "@/game/gameobject/task/move/MoveTask";
import { LocomotorType } from "@/game/type/LocomotorType";
import { ZoneType } from "@/game/gameobject/unit/ZoneType";
import { MoveState } from "../../trait/MoveTrait";

export class TeleportMoveToRefineryTask extends MoveTask {
  private teleportTile: any;
  private teleportCondition: ((unit: any, tile: any) => boolean) | undefined;

  constructor(game: any, teleportTile: any, targetTile?: any, teleportCondition?: (unit: any, tile: any) => boolean) {
    super(game, targetTile ?? teleportTile, false, {
      closeEnoughTiles: targetTile ? undefined : 0,
      strictCloseEnough: !targetTile,
    });
    this.teleportTile = teleportTile;
    this.teleportCondition = teleportCondition;
  }

  onStart(unit: any): void {
    super.onStart(unit);
    if (!unit.harvesterTrait || unit.rules.locomotor !== LocomotorType.Chrono) {
      throw new Error(`Vehicle ${unit.name} is not a chrono miner`);
    }
  }

  onTick(unit: any): boolean {
    if (unit.moveTrait.isDisabled()) {
      return false;
    }

    if (
      this.isCancelling() ||
      unit.moveTrait.moveState !== MoveState.ReachedNextWaypoint ||
      unit.tile === this.teleportTile ||
      !this.tryTeleportToRefinery(unit)
    ) {
      return super.onTick(unit) === true && (
        this.isCancelling() ||
        unit.tile === this.teleportTile ||
        this.tryTeleportToRefinery(unit)
      );
    }

    return true;
  }

  private tryTeleportToRefinery(unit: any): boolean {
    if (
      (this.teleportCondition && this.teleportCondition(unit, this.teleportTile) === false) ||
      this.game.map.terrain.findObstacles(
        { tile: this.teleportTile, onBridge: undefined },
        unit
      ).length > 0
    ) {
      return false;
    }

    unit.moveTrait.teleportUnitToTile(
      this.teleportTile,
      undefined,
      true,
      true,
      this.game
    );

    if (unit.zone === ZoneType.Air) {
      unit.zone = ZoneType.Ground;
      unit.position.tileElevation = 0;
    }

    return true;
  }
}