import { Action } from './Action';
import { DataStream } from '@/data/DataStream';
import { Building, BuildStatus } from '../gameobject/Building';
import { ActionType } from './ActionType';
import { DockableTrait } from '../gameobject/trait/DockableTrait';
import { Game } from '../Game';

export class SellObjectAction extends Action {
  private game: Game;
  private objectId: number;

  constructor(game: Game) {
    super(ActionType.SellObject);
    this.game = game;
  }

  unserialize(data: Uint8Array): void {
    this.objectId = new DataStream(data).readUint32();
  }

  serialize(): Uint8Array {
    return new DataStream(4)
      .writeUint32(this.objectId)
      .toUint8Array();
  }

  print(): string {
    return `Sell object ${this.objectId}`;
  }

  process(): void {
    const player = this.player;
    
    if (this.game.getWorld().hasObjectId(this.objectId)) {
      const object = this.game.getObjectById(this.objectId);
      
      if (object.isTechno() && 
          player === object.owner && 
          object.isSpawned) {
        
        const canSell = object.isBuilding() 
          ? object.buildStatus === BuildStatus.Ready && !object.warpedOutTrait.isActive()
          : object.traits.find(DockableTrait)?.dock?.rules.unitSell;
          
        if (canSell) {
          this.game.sellTrait.sell(object);
        }
      }
    }
  }
}