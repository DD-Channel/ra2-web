import { CompositeDisposable } from "@/util/disposable/CompositeDisposable";
import { AudioBagFile } from "@/data/AudioBagFile";
import { IdxFile } from "@/data/IdxFile";
import { Engine } from "@/engine/Engine";
import { LazyResourceCollection } from "@/engine/LazyResourceCollection";
import { WavFile } from "@/data/WavFile";

export class SoundTester {
  private static disposables = new CompositeDisposable();
  private static sounds: LazyResourceCollection<WavFile>;
  private static audioBag: AudioBagFile;
  private static listEl: HTMLDivElement;
  private static homeButton?: HTMLButtonElement;

  static async main(fileSystem: any, containerElement: HTMLElement): Promise<void> {
    this.sounds = Engine.getSounds();
    this.audioBag = new AudioBagFile();

    const audioBagFile = fileSystem.openFile("audio.bag");
    const audioIdxFile = fileSystem.openFile("audio.idx");

    this.audioBag.fromVirtualFile(audioBagFile, new IdxFile(audioIdxFile.stream));
    fileSystem.addArchive(this.audioBag, "audio.bag");

    this.buildBrowser();
    this.buildHomeButton();
  }

  private static selectSound(soundName: string): void {
    const audioContext = new AudioContext();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5;

    const soundData = new Uint8Array(this.sounds.get(soundName).getData()).buffer;

    audioContext.decodeAudioData(
      soundData,
      (audioBuffer: AudioBuffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(gainNode).connect(audioContext.destination);
        source.start(0);
      },
      (error: DOMException) => console.log(error)
    );
  }

  private static buildBrowser(): void {
    const listElement = this.listEl = document.createElement("div");
    
    // Style the browser
    listElement.style.position = "absolute";
    listElement.style.right = "0";
    listElement.style.top = "0";
    listElement.style.height = "600px";
    listElement.style.width = "200px";
    listElement.style.overflowY = "auto";
    listElement.style.padding = "5px";
    listElement.style.background = "rgba(255, 255, 255, 0.5)";
    listElement.style.border = "1px black solid";

    listElement.appendChild(document.createTextNode("Sound files:"));

    const fileList = this.audioBag.getFileList();
    fileList.forEach((fileName: string) => {
      const link = document.createElement("a");
      link.style.display = "block";
      link.textContent = fileName;
      link.setAttribute("href", "javascript:;");
      
      link.addEventListener("click", () => {
        this.selectSound(fileName);
      });
      
      listElement.appendChild(link);
    });

    document.body.appendChild(listElement);
  }

  private static buildHomeButton(): void {
    const homeButton = this.homeButton = document.createElement('button');
    homeButton.innerHTML = '← 主页';
    homeButton.style.cssText = `
      position: absolute;
      left: 10px;
      top: 10px;
      padding: 8px 16px;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      z-index: 1000;
      transition: background-color 0.2s;
    `;
    homeButton.onmouseover = () => {
      homeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    };
    homeButton.onmouseout = () => {
      homeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    };
    homeButton.onclick = () => {
      window.location.hash = '/';
    };
    document.body.appendChild(homeButton);
  }

  static destroy(): void {
    this.listEl?.remove();
    if (this.homeButton) {
      this.homeButton.remove();
      this.homeButton = undefined;
    }
    this.disposables.dispose();
  }
}