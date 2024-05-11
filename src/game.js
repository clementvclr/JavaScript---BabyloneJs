import { ActionManager, Color3, Color4, Engine, FollowCamera, FreeCamera,ArcRotateCamera, GlowLayer, HavokPlugin, HemisphericLight, InterpolateValueAction, KeyboardEventTypes, Mesh, MeshBuilder, ParticleSystem, PhysicsAggregate, PhysicsHelper, PhysicsMotionType, PhysicsRadialImpulseFalloff, PhysicsShapeType, Scalar, Scene, SceneLoader, SetValueAction, ShadowGenerator, SpotLight, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, Control, TextBlock } from "@babylonjs/gui";
import { Inspector } from "@babylonjs/inspector";

import Player from "./player";

// Sert à importer des modeles situer dans le dossier du projetc:\Users\ahmed\Downloads\car.glb
import meshUrl from "../assets/models/HVGirl.glb";
import theatreUrl from "../assets/models/low_poly_bolshoi_theatre.glb";

import floorUrl from "../assets/textures/floor.png";
import floorBumpUrl from "../assets/textures/floor_bump.PNG";

import girlHvmodel from "../assets/models/HVGirl.glb";

class Game {
    #canvas;
    #engine;
    #player;
    #camera;  // Utilisation de la caméra comme propriété de la classe
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

    constructor(canvas, engine) {
        this.#canvas = canvas;
        this.#engine = engine;
    }

    async start() {
        await this.initGame();
        this.gameLoop();
        this.endGame();
    }

    async initGame() {
        this.#gameScene = await this.createScene();
        this.#player = new Player(0, 0, 0, 100, this.#gameScene, this.#camera);
        await this.#player.init();
    
        // Définir la position du joueur comme le point cible de l'ArcRotateCamera
        this.#camera.target = this.#player.gameObject.position;

        this.initInput();
        this.setupUI();
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
        console.log(this.#camera.alpha);
        this.#phase += this.#vitesseY * delta;
        this.#sphere.position.y = 2 + Math.sin(this.#phase);
        this.#sphere.scaling.y = 1 + 0.125 * Math.sin(this.#phase);

        if (this.#player.gameObject.intersectsMesh(this.#zoneA, false)) {
            console.log("Collision");
            this.#sphere.material.emissiveColor = Color3.Red();
        } else {
            this.#sphere.material.emissiveColor = Color3.Black();
        }
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
            

        const sphere = MeshBuilder.CreateSphere("sphere",
        {diameter: 2, segments: 32}, this.#scene);
        sphere.position.y = 1;
        shadowGenerator.addShadowCaster(sphere); //indique que la sphere crée de l'ombre
        this.#sphere = sphere;

        const ground = MeshBuilder.CreateGround("ground",
        {width: 6, height: 6}, this.#scene);
        ground.receiveShadows = true; //reçois l'ombre

        const matGround = new StandardMaterial("boue", this.#scene);
        //matGround.diffuseTexture = new Texture(floorUrl);
        matGround.bumpTexture = new Texture(floorBumpUrl);
        ground.material = matGround;

        const matSphere = new StandardMaterial("silver", this.#scene);
        matSphere.diffuseColor = new Color3(0.8, 0.8, 1);
        matSphere.specularColor = new Color3(0.4, 0.4, 1);
        sphere.material = matSphere;


        sphere.actionManager = new ActionManager(this.#scene); 
        sphere.actionManager.registerAction( new InterpolateValueAction(ActionManager.OnPickTrigger, light, 'diffuse', Color3.Black(), 1000 ) );

        this.#zoneA = MeshBuilder.CreateBox("zoneA", {width:8, height:0.2, depth:8}, this.#scene); 
        let zoneMat = new StandardMaterial("zoneA", this.#scene); 
        zoneMat.diffuseColor = Color3.Red(); 
        zoneMat.alpha = 0.5; 
        this.#zoneA.material = zoneMat; 
        this.#zoneA.position = new Vector3(12, 0.1, 12);

        this.#zoneB = MeshBuilder.CreateBox("zoneB", {width:8, height:0.2, depth:8}, this.#scene); 
        let zoneMatB = new StandardMaterial("zoneB", this.#scene); 
        zoneMatB.diffuseColor = Color3.Green(); zoneMatB.alpha = 0.5; 
        this.#zoneB.material = zoneMatB; 
        this.#zoneB.position = new Vector3(-12, 0.1, -12);
        sphere.actionManager.registerAction( 
            new SetValueAction( 
                {trigger:ActionManager.OnIntersectionEnterTrigger, 
                    parameter: this.#zoneB }, 
                    sphere.material, 
                    'diffuseColor', 
                    Color3.Green() 
            ) 
        );

        return this.#scene;
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