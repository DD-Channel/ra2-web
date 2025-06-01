import { Order } from "@/game/order/Order";
import { OrderType } from "@/game/order/OrderType";
import { PointerType } from "@/engine/type/PointerType";
import { AttackTask } from "@/game/gameobject/task/AttackTask";
import { RangeHelper } from "@/game/gameobject/unit/RangeHelper";
import { OrderFeedbackType } from "@/game/order/OrderFeedbackType";
import { LosHelper } from "@/game/gameobject/unit/LosHelper";
import { ArmorType } from "@/game/type/ArmorType";
import { PlantC4Task } from "@/game/gameobject/task/PlantC4Task";
import { ZoneType } from "@/game/gameobject/unit/ZoneType";
import { MoveTask } from "@/game/gameobject/task/move/MoveTask";
import { MovementZone } from "@/game/type/MovementZone";
import { LocomotorType } from "@/game/type/LocomotorType";

interface AttackOrderOptions {
  forceAttack?: boolean;
  noIvanBomb?: boolean;
}

export class AttackOrder extends Order {
  private game: any;
  private isC4: boolean = false;
  private forceAttack: boolean;
  private ivanBombAllowed: boolean;
  private targetOptional: boolean = false;
  private feedbackType: OrderFeedbackType;
  private rangeHelper: RangeHelper;
  private losHelper: LosHelper;
  private terminal?: boolean;

  constructor(game: any, options: AttackOrderOptions = {}) {
    const { forceAttack = false, noIvanBomb = false } = options;
    
    super(forceAttack ? OrderType.ForceAttack : OrderType.Attack);
    
    this.game = game;
    this.forceAttack = forceAttack;
    this.ivanBombAllowed = !noIvanBomb || forceAttack;
    this.feedbackType = OrderFeedbackType.None;
    this.rangeHelper = new RangeHelper(this.game.map.tileOccupation);
    this.losHelper = new LosHelper(this.game.map.tiles, game.map.tileOccupation);
  }

  getPointerType(isMini: boolean, units: any[]): PointerType {
    if (!this.isAllowed()) {
      return isMini ? PointerType.NoActionMini : PointerType.NoAction;
    }

    if (this.isC4) {
      return PointerType.C4;
    }

    const weapon = this.sourceObject.attackTrait?.selectWeaponVersus(
      this.sourceObject,
      this.target,
      this.game,
      this.forceAttack
    );

    if (weapon?.rules.sabotageCursor) {
      return PointerType.C4;
    }

    if (
      this.ivanBombAllowed &&
      this.sourceObject.rules.ivan &&
      weapon?.warhead.rules.ivanBomb
    ) {
      return PointerType.Dynamite;
    }

    if (weapon?.warhead.rules.bombDisarm) {
      return PointerType.DefuseBomb;
    }

    if (weapon && weapon.rules.damage < 0) {
      return PointerType.RepairMove;
    }

    const allUnitsInRange = units.every((unit) => {
      if (!unit.attackTrait) return true;

      const unitWeapon = unit.attackTrait.selectWeaponVersus(
        unit,
        this.target,
        this.game,
        this.forceAttack
      );

      if (!unitWeapon) return true;

      return (
        this.rangeHelper.isInWeaponRange(
          unit,
          this.target.obj || this.target.tile,
          unitWeapon,
          this.game.rules
        ) &&
        this.losHelper.hasLineOfSight(
          unit,
          this.target.obj || this.target.tile,
          unitWeapon
        )
      );
    });

    if (isMini) {
      return PointerType.AttackMini;
    }

    return allUnitsInRange ? PointerType.AttackRange : PointerType.AttackNoRange;
  }

  isValid(): boolean {
    if (!this.sourceObject.attackTrait) return false;

    if (
      this.forceAttack &&
      this.game.mapShroudTrait
        .getPlayerShroud(this.sourceObject.owner)
        ?.isShrouded(this.target.tile, this.target.obj?.tileElevation) &&
      !this.sourceObject.isBuilding()
    ) {
      return false;
    }

    const targetObj = this.target.obj;
    const terrainObj = this.game.map
      .getGroundObjectsOnTile(this.target.tile)
      .find((obj: any) => obj.isTerrain());

    this.terminal = !targetObj && !terrainObj;

    // Check for C4 attack
    if (
      this.sourceObject.c4 &&
      targetObj?.isBuilding() &&
      targetObj.c4ChargeTrait &&
      (this.forceAttack ||
        !this.game.areFriendly(targetObj, this.sourceObject) ||
        targetObj.cabHutTrait)
    ) {
      this.isC4 = true;
      this.feedbackType = OrderFeedbackType.SpecialAttack;
      return true;
    }

    this.isC4 = false;
    this.feedbackType = OrderFeedbackType.Attack;

    if (!this.game.isValidTarget(targetObj)) return false;

    if (!targetObj && terrainObj?.rules.immune) return false;

    if (
      !targetObj &&
      this.target.tile === this.sourceObject.tile &&
      !(this.sourceObject.isUnit() && this.sourceObject.zone === ZoneType.Air)
    ) {
      return false;
    }

    if (targetObj === this.sourceObject) return false;

    const weapon = this.sourceObject.attackTrait.selectWeaponVersus(
      this.sourceObject,
      this.target,
      this.game,
      this.forceAttack
    );

    if (!weapon) return false;

    if (!this.ivanBombAllowed && weapon.warhead.rules.ivanBomb) return false;

    if (
      targetObj?.isBuilding() &&
      targetObj.cabHutTrait &&
      !weapon.warhead.rules.ivanBomb &&
      !weapon.warhead.rules.bombDisarm
    ) {
      return false;
    }

    // Check if unit can move or is in range
    const canMoveOrInRange = 
      (this.sourceObject.isUnit() &&
        this.sourceObject.moveTrait &&
        !this.sourceObject.moveTrait.isDisabled()) ||
      this.rangeHelper.isInWeaponRange(
        this.sourceObject,
        targetObj || this.target.tile,
        weapon,
        this.game.rules
      );

    if (!canMoveOrInRange) return false;

    // Check air spawn bounds
    if (
      this.sourceObject.airSpawnTrait &&
      weapon.rules.spawner &&
      !this.game.map.isWithinBounds(this.target.tile)
    ) {
      return false;
    }

    // Force attack bypasses remaining checks
    if (this.forceAttack) return true;

    // Hospital check
    if (targetObj?.isBuilding() && targetObj.hospitalTrait) return false;

    // Health trait check
    if (!targetObj || !targetObj.healthTrait) return false;

    // Destroyed/crashing check
    if (targetObj.isDestroyed || targetObj.isCrashing) return false;

    // Overlay/wall check
    if (
      targetObj.isOverlay() &&
      (weapon.warhead.rules.wall ||
        (weapon.warhead.rules.wood && targetObj.rules.armor === ArmorType.Wood)) &&
      !targetObj.isTechno()
    ) {
      return false;
    }

    return true;
  }

  isAllowed(): boolean {
    return !this.sourceObject.attackTrait.isDisabled();
  }

  process(): any[] {
    if (this.isC4) {
      return [new PlantC4Task(this.game, this.target.obj)];
    }

    const weapon = this.sourceObject.attackTrait.selectWeaponVersus(
      this.sourceObject,
      this.target,
      this.game,
      this.forceAttack
    );

    return [
      new AttackTask(this.game, this.target, weapon, {
        force: this.forceAttack,
      }),
    ];
  }

  onAdd(tasks: any[], isQueued: boolean): boolean {
    const unit = this.sourceObject;

    if (!isQueued && unit.isUnit() && this.isValid() && this.isAllowed()) {
      if (unit.rules.movementZone === MovementZone.Fly) {
        const existingTask = tasks.find(
          (task) =>
            (task.constructor === MoveTask || task.constructor === AttackTask) &&
            !task.isCancelling()
        );

        if (
          existingTask &&
          (unit.moveTrait.currentWaypoint?.tile === this.target.tile ||
            unit.isAircraft() ||
            existingTask.constructor === AttackTask) &&
          existingTask.forceCancel(unit)
        ) {
          const taskIndex = tasks.indexOf(existingTask);
          tasks.splice(taskIndex, 1);
        }
      } else {
        // Apply speed penalty for vehicles and ships
        if (
          tasks.length &&
          unit.isUnit() &&
          (unit.rules.locomotor === LocomotorType.Vehicle ||
            unit.rules.locomotor === LocomotorType.Ship)
        ) {
          unit.moveTrait.speedPenalty = 0.5;
        }

        // Handle temporal weapon updates
        const existingAttackTask = tasks.find(
          (task) => task.constructor === AttackTask && !task.isCancelling()
        );

        if (existingAttackTask?.getWeapon().warhead.rules.temporal) {
          existingAttackTask.setForceAttack(this.forceAttack);
          existingAttackTask.requestTargetUpdate(this.target);
          return false;
        }
      }
    }

    return true;
  }
}