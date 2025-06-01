import { ObjectType } from "@/engine/type/ObjectType";

// Base map object used when parsing .map files. This is NOT an in-game entity,
// it is just a lightweight data holder mirroring the original JS structure.
export class MapObject {
  constructor(public type: ObjectType) {}

  isStructure(): boolean {
    return this.type === ObjectType.Building;
  }

  isVehicle(): boolean {
    return this.type === ObjectType.Vehicle;
  }

  isInfantry(): boolean {
    return this.type === ObjectType.Infantry;
  }

  isAircraft(): boolean {
    return this.type === ObjectType.Aircraft;
  }

  isTerrain(): boolean {
    return this.type === ObjectType.Terrain;
  }

  isSmudge(): boolean {
    return this.type === ObjectType.Smudge;
  }

  isOverlay(): boolean {
    return this.type === ObjectType.Overlay;
  }

  // Helper checks copied from the original project
  isNamed(): boolean {
    return "name" in this;
  }

  isTechno(): boolean {
    return "health" in this;
  }
}

export class Structure extends MapObject {
  constructor() {
    super(ObjectType.Building);
  }
}

export class Vehicle extends MapObject {
  constructor() {
    super(ObjectType.Vehicle);
  }
}

export class Infantry extends MapObject {
  constructor() {
    super(ObjectType.Infantry);
  }
}

export class Aircraft extends MapObject {
  constructor() {
    super(ObjectType.Aircraft);
  }
}

export class Terrain extends MapObject {
  constructor() {
    super(ObjectType.Terrain);
  }
}

export class Smudge extends MapObject {
  constructor() {
    super(ObjectType.Smudge);
  }
}

export class Overlay extends MapObject {
  constructor() {
    super(ObjectType.Overlay);
  }
} 