import type { Voxel } from './Voxel'; // Voxel type will be defined in Voxel.ts

export class VoxelField {
  public sizeX: number;
  public sizeY: number;
  public sizeZ: number;
  private arr: (Voxel | undefined)[]; // Array can hold Voxel instances or be undefined

  constructor(sizeX: number, sizeY: number, sizeZ: number) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.sizeZ = sizeZ;
    // Initialize with undefined, or consider a more memory-efficient sparse structure if appropriate
    this.arr = new Array(sizeX * sizeY * sizeZ).fill(undefined);
  }

  add(voxel: Voxel): void {
    // Assuming Voxel has x, y, z properties
    if (
      voxel.x >= 0 && voxel.x < this.sizeX &&
      voxel.y >= 0 && voxel.y < this.sizeY &&
      voxel.z >= 0 && voxel.z < this.sizeZ
    ) {
      this.arr[voxel.x + voxel.y * this.sizeX + voxel.z * this.sizeX * this.sizeY] =
        voxel;
    } else {
      console.warn("VoxelField.add: Voxel coordinates out of bounds.", voxel);
    }
  }

  get(x: number, y: number, z: number): Voxel | undefined {
    if (x < 0 || x >= this.sizeX || y < 0 || y >= this.sizeY || z < 0 || z >= this.sizeZ) {
      return undefined; // Out of bounds
    }
    return this.arr[x + y * this.sizeX + z * this.sizeX * this.sizeY];
  }
  
  // Optional: A method to iterate over all voxels
  forEachVoxel(callback: (voxel: Voxel, x: number, y: number, z: number) => void): void {
      for (let z = 0; z < this.sizeZ; z++) {
          for (let y = 0; y < this.sizeY; y++) {
              for (let x = 0; x < this.sizeX; x++) {
                  const voxel = this.get(x,y,z);
                  if (voxel) {
                      callback(voxel, x, y, z);
                  }
              }
          }
      }
  }
}
