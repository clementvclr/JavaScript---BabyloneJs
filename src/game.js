import { ActionManager, Color3, Color4, Engine, FollowCamera, FreeCamera, GlowLayer, HavokPlugin, HemisphericLight, InterpolateValueAction, KeyboardEventTypes, Mesh, MeshBuilder, ParticleSystem, PhysicsAggregate, PhysicsHelper, PhysicsMotionType, PhysicsRadialImpulseFalloff, PhysicsShapeType, Scalar, Scene, SceneLoader, SetValueAction, ShadowGenerator, SpotLight, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";

import { Inspector } from "@babylonjs/inspector";

// Sert à importer des modeles situer dans le dossier du projetc:\Users\ahmed\Downloads\car.glb
import meshUrl from "../assets/models/HVGirl.glb";
import theatreUrl from "../assets/models/low_poly_bolshoi_theatre.glb";

import floorUrl from "../assets/textures/floor.png";
import floorBumpUrl from "../assets/textures/floor_bump.PNG";

class Game {

    #canvas;
    #engine;

    #gameScene;

    #sphere;
    #phase = 0.0;

    constructor(canvas, engine) {
        this.#canvas = canvas;
        this.#engine = engine;
    }

    start() {
        this.initGame();
        this.gameLoop();
        this.endGame();

        // Inspector dans le Start
        //Inspector.Show(scene, {});
    }


    initGame() {
        this.#gameScene = this.createScene();
    }

    gameLoop() {
        this.#engine.runRenderLoop( ()=> {
            this.updateGame();
            this.#gameScene.render();
        });

    }

    updateGame(){
        this.#phase += 0.03;
        this.#sphere.position.y = 2+Math.sin(this.#phase) ;
    }

    endGame() {

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

        SceneLoader.ImportMesh("","",theatreUrl,scene, function(theater) {
            theater.name = "theater";
        })

        const matGround = new StandardMaterial("boue", scene);
        //matGround.diffuseTexture = new Texture(floorUrl);
        matGround.bumpTexture = new Texture(floorBumpUrl);
        ground.material = matGround;

        const matSphere = new StandardMaterial("silver", scene);
        matSphere.diffuseColor = new Color3(0.8, 0.8, 1);
        matSphere.specularColor = new Color3(0.4, 0.4, 1);
        sphere.material = matSphere;
        return scene;
    }
        
}

export default Game;