import { ActionManager, Color3, Color4, Engine, FollowCamera, FreeCamera,ArcRotateCamera, GlowLayer, HavokPlugin, HemisphericLight, InterpolateValueAction, KeyboardEventTypes, Mesh, MeshBuilder, ParticleSystem, PhysicsAggregate, PhysicsHelper, PhysicsMotionType, PhysicsRadialImpulseFalloff, PhysicsShapeType, Scalar, Scene, SceneLoader, SetValueAction, ShadowGenerator, SpotLight, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, Control, TextBlock } from "@babylonjs/gui";
import { Inspector } from "@babylonjs/inspector";
import Player from "./player";
import { SoundManager } from "./soundmanager";
import floorBumpUrl from "../assets/textures/floor_bump.PNG";
import { GlobalManager, States } from "./globalmanager";
import MenuUI from "./menuUI";
import HavokPhysics from "@babylonjs/havok";

class Game {
    #canvas;
    #engine;
    #havokInstance;

    #player;
    #camera;
    #scene;
    #bInspector = false;
    inputMap = {};
    actions = {};
    #gameScene;
    #sphere;
    #phase = 0.0;
    #vitesseY = 0.0018;
    #zoneA;
    #zoneB;

    #menuUI;

    constructor(canvas, engine) {
        this.#canvas = canvas;
        this.#engine = engine;
        GlobalManager.init(canvas, engine);
    }

    async start() {
        await this.initGame();
        GlobalManager.gameState = States.STATE_MENU;
        this.gameLoop();
        this.endGame();
    }

    async initGame() {
        GlobalManager.gameState = States.STATE_INIT;
        this.#havokInstance = await this.getInitializedHavok();
        
        
        this.#gameScene = await this.createScene();
        this.#scene.collisionsEnabled = true;
        await SoundManager.init();
        this.#player = new Player(0, 0, 0, 100, this.#gameScene, this.#camera);
        await this.#player.init();
    
        // Définir la position du joueur comme le point cible de l'ArcRotateCamera
        this.#camera.target = this.#player.gameObject.position;

        this.initInput();
        this.setupUI();

        this.#menuUI = new MenuUI();
        await this.#menuUI.init();
        this.#menuUI.show(true);

        SoundManager.playMusic(SoundManager.Musics.START_MUSIC);
    }

    gameLoop() {
        if (!this.#camera) {
            console.error("Camera not initialized.");
            return; // Stop ou reportez le gameLoop jusqu'à ce que la caméra soit prête
        }
        const divFps = document.getElementById("fps");
        if (this.actions["KeyI"]) { 
            this.#bInspector = !this.#bInspector; 
            if (this.#bInspector) 
                Inspector.Show(); 
            else 
                Inspector.Hide(); 
        }
        this.#engine.runRenderLoop(() => {
            this.updateGame();

            switch (GlobalManager.gameState) {
                
                case States.STATE_MENU:
                    break;
                
                case States.STATE_START_GAME:
                    this.#menuUI.show(false);

                    GlobalManager.gameState = States.STATE_LEVEL_READY;
                    break;
            }           

            if (this.actions["KeyI"]) { 
                this.#bInspector = !this.#bInspector; 
                if (this.#bInspector) 
                    Inspector.Show(); 
                else 
                    Inspector.Hide(); 
            }

            this.actions = {};
            divFps.innerHTML = `${this.#engine.getFps().toFixed()} fps`;
            this.#gameScene.render();
        });           
    }

    updateGame() {
        let delta = this.#engine.getDeltaTime() / 1000.0;

        this.#player.update(this.inputMap, this.actions, delta);
        this.#player.setRotationY( -this.#camera.alpha - Math.PI / 2);

        this.#phase += this.#vitesseY * delta;

    }

    endGame() {
        // Nettoyage ou logique de fin de jeu si nécessaire
    }

    initInput() {
        this.#gameScene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    this.inputMap[kbInfo.event.code] = true;
                    console.log(`KEY DOWN: ${kbInfo.event.code} / ${kbInfo.event.key}`);
                    break;
                
                case KeyboardEventTypes.KEYUP:
                    this.inputMap[kbInfo.event.code] = false;
                    this.actions[kbInfo.event.code] = true;
                    console.log(`KEY UP: ${kbInfo.event.code} / ${kbInfo.event.key}`);
                    break;
            }
        });
    }   

    createScene() {
        this.#scene = new Scene(this.#engine);
        const hk = new HavokPlugin(true, this.#havokInstance);
        // enable physics in the scene with a gravity
        this.#scene.enablePhysics(new Vector3(0, -9.81, 0), hk);


        // Création et configuration de l'ArcRotateCamera
        this.#camera = new ArcRotateCamera("arcRotateCam", Math.PI / 2, Math.PI / 4, 10, new Vector3(0, 1, 0), this.#scene);
        this.#camera.alpha = 0;
        this.#camera.lowerBetaLimit = 0.1;  // Limite inférieure de la rotation verticale (en radians)
        this.#camera.upperBetaLimit = Math.PI / 2.1;  // Limite supérieure de la rotation verticale, un peu moins que PI/2 pour éviter de regarder directement vers le bas
        this.#camera.lowerRadiusLimit = 10;  // Limite inférieure de la distance de la caméra
        this.#camera.upperRadiusLimit = 10;  // Limite supérieure de la distance de la caméra, la même pour maintenir une distance constante

        // Attacher la caméra au canvas pour permettre la rotation contrôlée par la souris
        this.#camera.attachControl(this.#canvas, true);
   
        // Événement de mouvement de la souris pour ajuster la rotationOffset
        this.#canvas.addEventListener('mousemove', (event) => {
            if (event.buttons === 1) {  // Bouton gauche de la souris maintenu
                this.#camera.rotationOffset += event.movementX * 0.1;
            }
        });

        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.#scene);
        light.intensity = 0.7;

        const sLight = new SpotLight("spot1", new Vector3(0, 20, 20), new Vector3(0, -
            1, -1), 1.2, 24, this.#scene);
        const shadowGenerator = new ShadowGenerator(1024, sLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
            

        const ground = MeshBuilder.CreateGround("ground", { width: 320, height: 320, subdivisions: 128 }, this.scene);
        ground.position = new Vector3(0, -0.1, 0);
        ground.receiveShadows = true; //reçois l'ombre

        const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, friction: 0.7, restitution: 0.2 }, GlobalManager.scene);
        groundAggregate.body.setMotionType(PhysicsMotionType.STATIC);

        const matGround = new StandardMaterial("boue", this.#scene);
        matGround.bumpTexture = new Texture(floorBumpUrl);
        ground.material = matGround;

        return this.#scene;
    }

    async getInitializedHavok() {
        return await HavokPhysics();
    }

    setupUI() {
        
        const gui = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const enduranceBar = new Rectangle();
        
        enduranceBar.width = 0.2; // 20% de la largeur de l'écran
        enduranceBar.height = "40px";
        enduranceBar.cornerRadius = 20;
        enduranceBar.color = "white";
        enduranceBar.thickness = 4;
        enduranceBar.background = "grey";
        enduranceBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        enduranceBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        enduranceBar.top = "20px";
        enduranceBar.left = "-20px"; // Décalage de 20px depuis le bord droit
        gui.addControl(enduranceBar);

        const enduranceBarFill = new Rectangle();
        enduranceBarFill.width = `${this.#player.endurance}%`;
        enduranceBarFill.height = "100%";
        enduranceBarFill.cornerRadius = 20;
        enduranceBarFill.background = "blue";
        enduranceBarFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        enduranceBar.addControl(enduranceBarFill);

        const label = new TextBlock();
        label.text = "Endurance";
        label.color = "white";
        label.height = "30px";
        label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        label.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        enduranceBar.addControl(label);

        this.#scene.onBeforeRenderObservable.add(() => {
            enduranceBarFill.width = `${this.#player.endurance}%`; // Mise à jour de la largeur de la barre en fonction de l'endurance du joueur
        });
    }      
}
export default Game;