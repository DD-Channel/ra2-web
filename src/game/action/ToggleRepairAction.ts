import { Action } from './Action';
import { DataStream } from '@/data/DataStream';
import { AutoRepairTrait } from '../gameobject/trait/AutoRepairTrait';
import { BuildingRepairStartEvent } from '../event/BuildingRepairStartEvent';
import { ActionType } from './ActionType';
import { Game } from '../Game';

export class ToggleRepairAction extends Action {
  private game: Game;
  private buildingId: number;

  constructor(game: Game) {
    super(ActionType.ToggleRepair);
    this.game = game;
  }

  unserialize(data: Uint8Array): void {
    this.buildingId = new DataStream(data).readUint32();
  }

  serialize(): Uint8Array {
    return new DataStream(4)
      .writeUint32(this.buildingId)
      .toUint8Array();
  }

  print(): string {
    return `Toggle repair ${this.buildingId}`;
  }

  process(): void {
    const player = this.player;
    
    if (this.game.getWorld().hasObjectId(this.buildingId)) {
      const building = this.game.getObjectById(this.buildingId);
      
      if (building.isBuilding() && 
          player === building.owner && 
          !building.isDestroyed &&
          building.rules.repairable &&
          building.rules.clickRepairable &&
          building.healthTrait.health !== 100) {
        
        const repairTrait = building.traits.get(AutoRepairTrait);
        repairTrait.setDisabled(!repairTrait.isDisabled());
        
        if (!repairTrait.isDisabled()) {
          this.game.events.dispatch(new BuildingRepairStartEvent(building));
        }
      }
    }
  }
}