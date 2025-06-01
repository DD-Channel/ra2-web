import { Action } from './Action';
import { DataStream } from '@/data/DataStream';
import { ProductionQueue, QueueType, QueueStatus } from '../player/production/ProductionQueue';
import { ObjectType } from '@/engine/type/ObjectType';
import { ActionType } from './ActionType';
import { Game } from '../Game';

enum UpdateType {
  Add = 0,
  Cancel = 1,
  Pause = 2,
  Resume = 3
}

export class UpdateQueueAction extends Action {
  private game: Game;
  private queueType: number;
  private updateType: UpdateType;
  private item?: any;
  private quantity?: number;

  constructor(game: Game) {
    super(ActionType.UpdateQueue);
    this.game = game;
  }

  unserialize(data: Uint8Array): void {
    const stream = new DataStream(data);
    this.queueType = stream.readUint8();
    this.updateType = stream.readUint8();

    if (this.updateType === UpdateType.Add || this.updateType === UpdateType.Cancel) {
      const index = stream.readUint32();
      const type = stream.readUint8();
      this.item = this.game.rules.getTechnoByInternalId(index, type);
      this.quantity = stream.readUint16();
    }
  }

  serialize(): Uint8Array {
    const stream = new DataStream(9);
    stream.dynamicSize = false;
    stream.writeUint8(this.queueType);
    stream.writeUint8(this.updateType);

    if (this.updateType === UpdateType.Add || this.updateType === UpdateType.Cancel) {
      if (this.quantity === undefined) {
        throw new Error("Missing quantity");
      }
      if (this.quantity > 65535) {
        throw new Error("Maximum quantity exceeded");
      }
      stream.writeUint32(this.item.index);
      stream.writeUint8(this.item.type);
      stream.writeUint16(this.quantity);
    }

    return new Uint8Array(stream.buffer, stream.byteOffset, stream.position);
  }

  print(): string {
    switch (this.updateType) {
      case UpdateType.Resume:
        return `Resume queue ${QueueType[this.queueType]}`;
      case UpdateType.Add:
        return `Add to queue ${this.item.name} x ${this.quantity}`;
      case UpdateType.Pause:
        return `Put queue ${QueueType[this.queueType]} on hold.`;
      case UpdateType.Cancel:
        return `Cancel ${this.item.name} x ${this.quantity}`;
      default:
        return `Unhandled queue update type ${this.updateType}`;
    }
  }

  process(): void {
    const player = this.player;
    const item = this.item;
    const queue = player.production.getQueue(this.queueType);

    if (this.updateType === UpdateType.Resume) {
      if (queue.status === QueueStatus.OnHold) {
        queue.status = QueueStatus.Active;
      }
    } else if (this.updateType === UpdateType.Add) {
      const existingItems = queue.find(item);
      if (
        queue.status === QueueStatus.Active ||
        queue.status === QueueStatus.Idle ||
        (queue.status === QueueStatus.OnHold && existingItems[0] !== queue.getFirst()) ||
        (queue.status === QueueStatus.Ready && item.type !== ObjectType.Building)
      ) {
        let buildLimit: number;
        const queuedQuantity = existingItems.reduce((sum, item) => sum + item.quantity, 0);

        if (Number.isFinite(item.buildLimit)) {
          const builtCount = item.buildLimit >= 0
            ? player.getOwnedObjectsByType(item.type, true)
                .filter(obj => obj.name === item.name).length
            : player.getLimitedUnitsBuilt(item.name);
          buildLimit = Math.max(0, Math.abs(item.buildLimit) - (builtCount + queuedQuantity));
        } else {
          buildLimit = Number.POSITIVE_INFINITY;
        }

        if (buildLimit && player.production.isAvailableForProduction(item)) {
          const maxQuantity = Math.min(
            queue.maxSize - queue.currentSize,
            queue.maxItemQuantity - queuedQuantity,
            buildLimit
          );
          const quantity = Math.min(this.quantity!, maxQuantity);
          
          if (quantity > 0) {
            queue.push(item, quantity, item.cost);
          }
        }
      }
    } else if (this.updateType === UpdateType.Cancel) {
      if ([QueueStatus.Ready, QueueStatus.OnHold, QueueStatus.Active].includes(queue.status)) {
        const existingItems = queue.find(item);
        if (existingItems.length) {
          const totalQuantity = existingItems.reduce((sum, item) => sum + item.quantity, 0);
          const cancelQuantity = Math.min(totalQuantity, this.quantity!);
          
          if (cancelQuantity > 0) {
            queue.pop(item, cancelQuantity);
            if (cancelQuantity === totalQuantity) {
              player.credits += existingItems[0].creditsSpent;
            }
          }
        }
      }
    } else if (this.updateType === UpdateType.Pause) {
      if (queue.status === QueueStatus.Active) {
        queue.status = QueueStatus.OnHold;
      }
    }
  }
}