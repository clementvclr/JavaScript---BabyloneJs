import { ActionManager, Color3, Color4, Engine, FollowCamera, FreeCamera, GlowLayer, HavokPlugin, HemisphericLight, InterpolateValueAction, KeyboardEventTypes, Mesh, MeshBuilder, ParticleSystem, PhysicsAggregate, PhysicsHelper, PhysicsMotionType, PhysicsRadialImpulseFalloff, PhysicsShapeType, Scalar, Scene, SceneLoader, SetValueAction, ShadowGenerator, SpotLight, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";

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

    #bInspector = false;

    #zoneA;
    #zoneB;

    inputMap = {}; 
    actions = {};
    

    #gameScene;

    #sphere;
    #phase = 0.0;
    #vitesseY = 0.0018;

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
        this.#gameScene = this.createScene();
        this.#player = new Player(3, 1, 3,100, this.#gameScene); 
        await this.#player.init();
        this.initInput();
    }

    gameLoop() {
        const divFps = document.getElementById("fps");
        //Debug 
        if (this.actions["KeyI"]) { 
            this.#bInspector = !this.#bInspector; 
            if (this.#bInspector) 
                Inspector.Show(); 
            else 
                Inspector.Hide(); 
        }


        this.#engine.runRenderLoop( ()=> {
            this.updateGame();
            if (this.actions["KeyI"]) { 
                this.#bInspector = !this.#bInspector; 
                if (this.#bInspector) 
                    Inspector.Show(); 
                else 
                    Inspector.Hide(); 
            }
            this.actions = {};
            divFps.innerHTML = this.#engine.getFps().toFixed() + " fps";
            this.#gameScene.render();
        });

    }

    updateGame(){

        let delta = this.#engine.getDeltaTime() / 1000.0 ;
        this.#player.update(this.inputMap, this.actions, delta);
        this.#phase += this.#vitesseY * delta;
        this.#sphere.position.y = 2+Math.sin(this.#phase) ;
        this.#sphere.scaling.y = 1 + 0.125*Math.sin(this.#phase);


        //Collisions 
        if (this.#player.gameObject.intersectsMesh(this.#zoneA, false)){
            console.log("Colision");
            this.#sphere.material.emissiveColor = Color3.Red();
        }
        else 
            this.#sphere.material.emissiveColor = Color3.Black();
    }

    endGame() {
    
    }

    initInput() { 

        this.#gameScene.onKeyboardObservable.add((kbInfo) => { switch (kbInfo.type) { 
            case KeyboardEventTypes.KEYDOWN: 
                this.inputMap[kbInfo.event.code] = true; 
                console.log(`KEY DOWN: ${kbInfo.event.code} / ${kbInfo.event.key}`); 
                break; 
            case KeyboardEventTypes.KEYUP: 
                this.inputMap[kbInfo.event.code] = false; 
                this.actions[kbInfo.event.code] = true; 
                console.log(`KEY UP: ${kbInfo.event.code} / ${kbInfo.event.key}`); 
                break; } 
        }); 

    }
        

    createScene() {

        const scene = new Scene(this.#engine);

        const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(this.#canvas, true);

        const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        const sLight = new SpotLight("spot1", new Vector3(0, 20, 20), new Vector3(0, -
            1, -1), 1.2, 24, scene);
        const shadowGenerator = new ShadowGenerator(1024, sLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
            

        const sphere = MeshBuilder.CreateSphere("sphere",
        {diameter: 2, segments: 32}, scene);
        sphere.position.y = 1;
        shadowGenerator.addShadowCaster(sphere); //indique que la sphere crée de l'ombre
        this.#sphere = sphere;

        const ground = MeshBuilder.CreateGround("ground",
        {width: 6, height: 6}, scene);
        ground.receiveShadows = true; //reçois l'ombre


        // SceneLoader.ImportMesh("", "",meshUrl, scene, function (newMeshes) {
        //     newMeshes[0].name = "Player";
        //     newMeshes[0].scaling = new Vector3(0.1,0.1,0.1)
        //     camera.target = newMeshes[0];
        // })

        // SceneLoader.ImportMesh("","",theatreUrl,scene, function(theater) {
        //     theater.name = "theater";
        // })

        const matGround = new StandardMaterial("boue", scene);
        //matGround.diffuseTexture = new Texture(floorUrl);
        matGround.bumpTexture = new Texture(floorBumpUrl);
        ground.material = matGround;

        const matSphere = new StandardMaterial("silver", scene);
        matSphere.diffuseColor = new Color3(0.8, 0.8, 1);
        matSphere.specularColor = new Color3(0.4, 0.4, 1);
        sphere.material = matSphere;


        sphere.actionManager = new ActionManager(scene); 
        sphere.actionManager.registerAction( new InterpolateValueAction(ActionManager.OnPickTrigger, light, 'diffuse', Color3.Black(), 1000 ) );

        this.#zoneA = MeshBuilder.CreateBox("zoneA", {width:8, height:0.2, depth:8}, scene); 
        let zoneMat = new StandardMaterial("zoneA", scene); 
        zoneMat.diffuseColor = Color3.Red(); 
        zoneMat.alpha = 0.5; 
        this.#zoneA.material = zoneMat; 
        this.#zoneA.position = new Vector3(12, 0.1, 12);

        this.#zoneB = MeshBuilder.CreateBox("zoneB", {width:8, height:0.2, depth:8}, scene); 
        let zoneMatB = new StandardMaterial("zoneB", scene); 
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

        return scene;
    }
        
}

export default Game;