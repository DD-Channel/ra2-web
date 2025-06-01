import { EventType } from "@/game/event/EventType";
import { RangeHelper } from "@/game/gameobject/unit/RangeHelper";
import { TriggerCondition } from "@/game/trigger/TriggerCondition";

export class ComesNearWaypointCondition extends TriggerCondition {
  private waypointTile: any; // TODO: Add proper type

  constructor(event: any, player: any) { // TODO: Add proper types
    super(event, player);
  }

  init(game: any): void { // TODO: Add proper type
    super.init(game);
    const waypointId = Number(this.event.params[1]);
    this.waypointTile = game.map.getTileAtWaypoint(waypointId);
    
    if (!this.waypointTile) {
      console.warn(
        `No valid location found for waypoint ${waypointId}. ` +
        `Skipping event ${this.getDebugName()}.`
      );
    }
  }

  check(game: any, events: any[]): boolean { // TODO: Add proper types
    if (!this.waypointTile || !this.player) {
      return false;
    }

    for (const event of events) {
      if (
        event.type === EventType.EnterTile &&
        event.source.owner === this.player
      ) {
        const rangeHelper = new RangeHelper(game.map.tileOccupation);
        if (rangeHelper.tileDistance(event.target, this.waypointTile) < 2) {
          return true;
        }
      }
    }
    return false;
  }
}