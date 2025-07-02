import { Coords } from "@/game/Coords";
import { TargetLinesConfig, cloneConfig, configsAreEqual, configHasTarget } from "@/game/gameobject/task/system/TargetLinesConfig";
import { ZoneType } from "@/game/gameobject/unit/ZoneType";
import * as THREE from "three";

interface LineObjects {
  root: THREE.Object3D;
  line: THREE.Line;
  srcLineHead: THREE.Mesh;
  destLineHead: THREE.Mesh;
}

export class TargetLines {
  private obj?: THREE.Object3D;
  private unitPaths: Map<any, TargetLinesConfig | undefined>;
  private unitLines: Map<any, LineObjects>;
  private lineHeadGeometry: THREE.PlaneGeometry;
  private attackLineMaterial?: THREE.LineBasicMaterial;
  private moveLineMaterial?: THREE.LineBasicMaterial;
  private attackLineHeadMaterial?: THREE.MeshBasicMaterial;
  private moveLineHeadMaterial?: THREE.MeshBasicMaterial;
  private selectionHash?: string;
  private showStart?: number;

  constructor(
    private currentPlayer: any,
    private unitSelection: any,
    private camera: any,
    private debugPaths: { value: boolean },
    private enabled: { value: boolean }
  ) {
    this.unitPaths = new Map();
    this.unitLines = new Map();
    this.lineHeadGeometry = new THREE.PlaneGeometry(
      3 * Coords.ISO_WORLD_SCALE,
      3 * Coords.ISO_WORLD_SCALE
    );
  }

  create3DObject(): void {
    if (!this.obj) {
      this.obj = new THREE.Object3D();
      this.obj.name = "target_lines";
      this.obj.matrixAutoUpdate = false;

      this.attackLineMaterial = new THREE.LineBasicMaterial({
        color: 11337728,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

      this.moveLineMaterial = new THREE.LineBasicMaterial({
        color: 43520,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

      this.attackLineHeadMaterial = new THREE.MeshBasicMaterial({
        color: 11337728,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

      this.moveLineHeadMaterial = new THREE.MeshBasicMaterial({
        color: 43520,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
    }
  }

  get3DObject(): THREE.Object3D | undefined {
    return this.obj;
  }

  forceShow(): void {
    this.selectionHash = undefined;
  }

  update(n: number): void {
    if (this.obj) {
      this.obj.visible = this.enabled.value;
    }

    if (this.enabled.value) {
      const hash = this.unitSelection.getHash();
      if (this.selectionHash === undefined || this.selectionHash !== hash) {
        this.selectionHash = hash;
        this.hideAllLines();
        this.unitPaths.clear();
        this.disposeUnitLines();

        this.unitSelection.getSelectedUnits().forEach((unit: any) => {
          if (
            unit.isUnit() &&
            (!this.currentPlayer || unit.owner === this.currentPlayer)
          ) {
            this.unitPaths.set(
              unit,
              cloneConfig(unit.unitOrderTrait.targetLinesConfig)
            );
            this.updateLines(unit);
            if (
              unit.zone !== ZoneType.Air &&
              !configHasTarget(unit.unitOrderTrait.targetLinesConfig)
            ) {
              return;
            }
            this.showLines(unit, n);
          }
        });
        return;
      }

      let needsUpdate = false;
      this.unitSelection.getSelectedUnits().forEach((unit: any) => {
        if (
          unit.isUnit() &&
          (!this.currentPlayer || unit.owner === this.currentPlayer)
        ) {
          if (
            !this.unitPaths.has(unit) ||
            !configsAreEqual(
              this.unitPaths.get(unit),
              unit.unitOrderTrait.targetLinesConfig
            ) ||
            unit.unitOrderTrait.targetLinesConfig?.isRecalc
          ) {
            this.unitPaths.set(
              unit,
              cloneConfig(unit.unitOrderTrait.targetLinesConfig)
            );
            needsUpdate = true;
            this.updateLines(unit);
            if (configHasTarget(unit.unitOrderTrait.targetLinesConfig)) {
              this.showLines(unit, n);
            }
          }

          const lineObjects = this.unitLines.get(unit);
          const worldPos = unit.position.worldPosition;
          if (lineObjects) {
            const srcChanged = !worldPos.equals(lineObjects.srcLineHead.position);
            const target = unit.unitOrderTrait.targetLinesConfig?.target;
            const targetPos = target ? target.position.worldPosition : undefined;
            const destChanged = targetPos && !targetPos.equals(lineObjects.destLineHead.position);

            if (srcChanged || destChanged) {
              const geometry = lineObjects.line.geometry;
              geometry.verticesNeedUpdate = true;

              if (srcChanged) {
                geometry.vertices[geometry.vertices.length - 1].copy(worldPos);
                lineObjects.srcLineHead.position.copy(worldPos);
                lineObjects.srcLineHead.updateMatrix();
              }

              if (targetPos && destChanged) {
                geometry.vertices[0].copy(targetPos);
                lineObjects.destLineHead.position.copy(targetPos);
                lineObjects.destLineHead.updateMatrix();
              }
            }
          }
        }
      });

      if (needsUpdate) {
        return;
      }

      if (this.showStart !== undefined && n - this.showStart >= 1000) {
        this.hideAllLines();
      }
    }
  }

  showLines(unit: any, time: number): void {
    this.showStart = time;
    const lineObjects = this.unitLines.get(unit);
    if (lineObjects) {
      lineObjects.root.visible = true;
    }
  }

  hideAllLines(): void {
    this.showStart = undefined;
    this.unitLines.forEach((objects) => {
      objects.root.visible = false;
    });
  }

  updateLines(unit: any): void {
    let config = unit.unitOrderTrait.targetLinesConfig;
    if (!config || !configHasTarget(config)) {
      if (unit.zone !== ZoneType.Air) {
        if (this.unitLines.has(unit)) {
          const objects = this.unitLines.get(unit)!;
          this.obj?.remove(objects.root);
          this.disposeLineObjects(objects);
          this.unitLines.delete(unit);
        }
        return;
      }
      config = {
        pathNodes: [
          { tile: unit.tile, onBridge: undefined },
          { tile: unit.tile, onBridge: undefined },
        ],
      };
    }

    const geometry = new THREE.Geometry();
    let pathNodes = config.pathNodes;

    if (pathNodes?.length) {
      if (!this.debugPaths.value) {
        pathNodes = [pathNodes[0], pathNodes[pathNodes.length - 1]];
      }

      pathNodes.forEach((node) => {
        const pos = Coords.tile3dToWorld(
          node.tile.rx + 0.5,
          node.tile.ry + 0.5,
          node.tile.z + (node.onBridge?.tileElevation ?? 0)
        );
        geometry.vertices.push(pos);
      });

      geometry.vertices[geometry.vertices.length - 1].copy(unit.position.worldPosition);
    } else {
      const target = config.target;
      geometry.vertices.push(target.position.worldPosition, unit.position.worldPosition);
    }

    const isAttack = !!config.isAttack;
    const material = isAttack ? this.attackLineMaterial! : this.moveLineMaterial!;
    const line = new THREE.Line(geometry, material);
    line.matrixAutoUpdate = false;

    const srcHead = this.createLineHead(isAttack);
    srcHead.position.copy(geometry.vertices[geometry.vertices.length - 1]);
    srcHead.matrixAutoUpdate = false;
    srcHead.updateMatrix();

    const destHead = this.createLineHead(isAttack);
    destHead.position.copy(geometry.vertices[0]);
    destHead.matrixAutoUpdate = false;
    destHead.updateMatrix();

    line.renderOrder = srcHead.renderOrder = destHead.renderOrder = 1000000;

    const root = new THREE.Object3D();
    root.matrixAutoUpdate = false;
    root.visible = false;
    root.add(line);
    root.add(srcHead);
    root.add(destHead);

    if (this.unitLines.has(unit)) {
      const oldObjects = this.unitLines.get(unit)!;
      this.obj?.remove(oldObjects.root);
      this.disposeLineObjects(oldObjects);
    }

    this.unitLines.set(unit, {
      root,
      line,
      srcLineHead: srcHead,
      destLineHead: destHead,
    });

    this.obj?.add(root);
  }

  createLineHead(isAttack: boolean): THREE.Mesh {
    const mesh = new THREE.Mesh(
      this.lineHeadGeometry,
      isAttack ? this.attackLineHeadMaterial! : this.moveLineHeadMaterial!
    );
    const quaternion = new THREE.Quaternion().setFromEuler(this.camera.rotation);
    mesh.setRotationFromQuaternion(quaternion);
    return mesh;
  }

  disposeUnitLines(): void {
    [...this.unitLines.values()].forEach((objects) =>
      this.disposeLineObjects(objects)
    );
    this.unitLines.clear();
  }

  disposeLineObjects(objects: LineObjects): void {
    objects.line.geometry.dispose();
  }

  dispose(): void {
    this.disposeUnitLines();
    this.attackLineMaterial?.dispose();
    this.attackLineHeadMaterial?.dispose();
    this.moveLineMaterial?.dispose();
    this.moveLineHeadMaterial?.dispose();
    this.lineHeadGeometry.dispose();
  }
}
