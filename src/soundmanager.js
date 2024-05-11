import { GlobalManager } from "./globalmanager";
import { AssetsManager, Sound } from "@babylonjs/core";

import music1Url from "../assets/music/menuTheme.mp3";
import music2Url from "../assets/music/gameMusic.mp3";
import music3Url from "../assets/music/mixkit-musical-game-over-959.wav"; //From Mixkit website

class SoundManager {


    SoundsFX = Object.freeze({
      WHISTLE: 0,
    })
  
  
    Musics = Object.freeze({
      START_MUSIC: 0,
      GAME_MUSIC: 1,
      GAMEOVER_MUSIC: 2,
    });
  
    #soundsFX = [];
    #musics = [ ];
  
    #prevMusic;
  
    static get instance() {
      return (globalThis[Symbol.for(`PF_${SoundManager.name}`)] ||= new this());
    }
  
    constructor() {
      this.#prevMusic = null;
    }
  
    async init() {
      return this.loadAssets();
    }
  
    update(delta) {
      
    }
  
    playSound(soundIndex) {
      if (soundIndex >= 0 && soundIndex < this.#soundsFX.length)
        this.#soundsFX[soundIndex].play();
    }
  
    playMusic(musicIndex) {
      if (this.#prevMusic != null)
        this.#musics[this.#prevMusic].stop();
      if (musicIndex >= 0 && musicIndex < this.#musics.length) {
        this.#musics[musicIndex].play();
        this.#prevMusic = musicIndex;
      }
    }
  
    async loadAssets() {
      return new Promise((resolve, reject) => {
  
        // Asset manager for loading texture and particle system
        let assetsManager = new AssetsManager(GlobalManager.scene);
  
        const music1Data = assetsManager.addBinaryFileTask("music1", music1Url);
        const music2Data = assetsManager.addBinaryFileTask("music2", music2Url);
        const music3Data = assetsManager.addBinaryFileTask("music3", music3Url);
  
        // after all tasks done, set up particle system
        assetsManager.onFinish = (tasks) => {
          console.log("tasks successful", tasks);
  
          this.#musics[this.Musics.START_MUSIC] = new Sound("music1", music1Data.data, GlobalManager.scene, undefined, { loop: true, autoplay: false, volume: 0.4 });
          this.#musics[this.Musics.GAME_MUSIC] = new Sound("music2", music2Data.data, GlobalManager.scene, undefined, { loop: true, autoplay: false, volume: 0.4 });
          this.#musics[this.Musics.GAMEOVER_MUSIC] = new Sound("music3", music3Data.data, GlobalManager.scene, undefined, { loop: false, autoplay: false, volume: 0.4 });
  
          resolve(true);
        }

        assetsManager.onError = (task, message, exception) => {
          console.log(task, message, exception);
          reject(false);
        }
  
  
        // load all tasks
        assetsManager.load();
  
      });
  
  
    }
  }
  
  const { instance } = SoundManager;
  export { instance as SoundManager };