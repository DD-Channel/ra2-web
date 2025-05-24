import { MapManifest } from './MapManifest'; // Assuming this path
import type { GameModes, GameModeEntry } from '../game/ini/GameModes';
import type { IniFile, IniSection } from '../data/IniFile';
import type { VirtualFile } from '../data/vfs/VirtualFile'; // For fromMapFile

export class MapList {
  private gameModes: GameModes;
  private manifests: MapManifest[] = [];

  constructor(gameModes: GameModes) {
    this.gameModes = gameModes;
  }

  addFromIni(iniFile: IniFile): this {
    const multiMapsSection = iniFile.getSection("MultiMaps");
    if (!multiMapsSection) {
      throw new Error("Invalid map list. Missing [MultiMaps] section.");
    }

    const newManifests = Array.from(multiMapsSection.entries.values()).map((sectionKey: string) => {
      const mapSection = iniFile.getSection(sectionKey);
      if (!mapSection) {
        throw new Error(`Invalid map list. Missing [${sectionKey}] section.`);
      }
      // Assuming GameModes.getAll() provides the GameModeEntry[] needed by fromIni
      return new MapManifest().fromIni(mapSection, this.gameModes.getAll());
    });

    this.manifests = this.manifests.concat(newManifests);
    this.dedupeEntries();
    return this;
  }

  add(manifest: MapManifest): void {
    this.manifests.push(manifest);
  }

  addFromMapFile(mapFile: VirtualFile): void {
    this.add(
      new MapManifest().fromMapFile(mapFile, this.gameModes.getAll()),
    );
  }

  getAll(): MapManifest[] {
    return this.manifests;
  }

  getByName(fileName: string): MapManifest | undefined {
    return this.manifests.find(
      (manifest) => manifest.fileName.toLowerCase() === fileName.toLowerCase(),
    );
  }

  sortByName(): void {
    this.manifests.sort((a, b) =>
      a.fileName.localeCompare(b.fileName),
    );
  }

  clone(): MapList {
    const newList = new MapList(this.gameModes);
    newList.manifests = [...this.manifests];
    return newList;
  }

  mergeWith(otherList: MapList): this {
    this.manifests.push(...otherList.manifests);
    this.dedupeEntries();
    return this;
  }

  private dedupeEntries(): void {
    this.manifests = [
      ...new Map(
        this.manifests.map((manifest) => [manifest.fileName.toLowerCase(), manifest]),
      ).values(),
    ];
  }
}
