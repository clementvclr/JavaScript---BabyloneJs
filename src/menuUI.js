import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { GlobalManager, States } from "./globalmanager";
import { SoundManager } from "./soundmanager";
import backgroundImageUrl from "../assets/picture/menu.jpg";
import backgroundImage2Url from "../assets/picture/menu.jpg";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Scalar } from "@babylonjs/core";

class MenuUI {

    screenUI = undefined;

    constructor() {
        this.getCanvasSize();
    }

    async init() {
      this.loadUI();
    }

    update() {

    }

    loadUI() {

        this.textScale = 1;
        let fontSize = 22 * this.textScale;
        let spacing = 150 * this.textScale;
    
        this.screenUI = AdvancedDynamicTexture.CreateFullscreenUI("menuUI", GlobalManager.scene);
        this.screenUI.background = "#e1b5a0";

        if (Scalar.RandomRange(0, 1) > 0.5)
          this.backgroundImage = new Image("background", backgroundImage2Url);
        else
          this.backgroundImage = new Image("background", backgroundImageUrl);

        this.backgroundImage.stretch = Image.STRETCH_UNIFORM;
        this.screenUI.addControl(this.backgroundImage);
    
        this.version = new TextBlock();
        this.version.text = "v1.0.0";
        this.version.color = "white";
        this.version.fontSize = fontSize;
        this.version.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.version.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.version.left = 10;
        this.version.top = 10;
        this.screenUI.addControl(this.version);
    
        this.buttonStart = Button.CreateSimpleButton("buttonStart", "PLAY");
        this.buttonStart.top = "30%";
        this.buttonStart.width = "350px";
        this.buttonStart.height = "100px";
        this.buttonStart.color = "orange";
        this.buttonStart.fontSize = 48;
        this.buttonStart.fontFamily = "Consolas";
        this.buttonStart.background = "white";
        this.buttonStart.cornerRadius = 48;
        this.buttonStart.thickness = 4;
        this.buttonStart.onPointerUpObservable.add(() => {
          console.log("click");
          if (GlobalManager.gameState == States.STATE_MENU){
            //this.hideGUI();
            GlobalManager.gameState = States.STATE_START_GAME;
            SoundManager.playMusic(SoundManager.Musics.GAME_MUSIC);
          }
        });
        this.screenUI.addControl(this.buttonStart);
        this.show(false);
    
        window.onresize = () => {
          this.getCanvasSize();
          // this.fixTextScale();
        }
      }

      show(bActive) {
        this.screenUI.rootContainer.isVisible = bActive;
        if (bActive)
          this.screenUI.background = "#e1b5a0";
        else
          this.screenUI.background = "";
      }

      getCanvasSize() {
        GlobalManager.canvasWidth = document.querySelector("canvas").width;
        GlobalManager.canvasHeight = document.querySelector("canvas").height;
      }
}
export default MenuUI;