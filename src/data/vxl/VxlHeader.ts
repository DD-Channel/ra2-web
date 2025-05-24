import type { DataStream } from "../DataStream";

export class VxlHeader {
  public static readonly size = 32; // Size of the header fields themselves, excluding palette

  public fileName: string = "";
  public paletteCount: number = 0;
  public headerCount: number = 0; // Number of VXL section headers
  public tailerCount: number = 0; // Number of VXL section tailers
  public bodySize: number = 0;    // Total size of VXL body data (all sections)
  public paletteRemapStart: number = 0;
  public paletteRemapEnd: number = 0;
  // The 768 bytes of palette data are skipped here, assumed to be read separately if needed.

  read(stream: DataStream): void {
    this.fileName = stream.readCString(16);
    this.paletteCount = stream.readUint32();
    this.headerCount = stream.readUint32();
    this.tailerCount = stream.readUint32();
    this.bodySize = stream.readUint32();
    this.paletteRemapStart = stream.readUint8();
    this.paletteRemapEnd = stream.readUint8();
    stream.skip(768); // Skip the embedded palette data in the header block
  }
} 