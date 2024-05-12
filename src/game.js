import { ActionManager, Color3, Color4, Engine, FollowCamera, FreeCamera,ArcRotateCamera, GlowLayer, HavokPlugin, HemisphericLight, InterpolateValueAction, KeyboardEventTypes, Mesh, MeshBuilder, ParticleSystem, PhysicsAggregate, PhysicsHelper, PhysicsMotionType, PhysicsRadialImpulseFalloff, PhysicsShapeType, Scalar, Scene, SceneLoader, SetValueAction, ShadowGenerator, SpotLight, StandardMaterial, Texture, Vector3, ExecuteCodeAction } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, Control, TextBlock, Image } from "@babylonjs/gui";
import { Inspector } from "@babylonjs/inspector";
import Player from "./player";
import { SoundManager } from "./soundmanager";
import floor from "../assets/textures/grass.png";
import terrain from "../assets/models/terrain.glb";
import treeUrl from "../assets/models/tree.glb";
import guideUrl from "../assets/picture/guide.png";
import natureUrl from "../assets/models/natureFloor.glb";
import floorBumpUrl from "../assets/textures/floor_bump.PNG";
import { GlobalManager, States } from "./globalmanager";
import MenuUI from "./menuUI";

class Game {
    #canvas;
    #engine;
    #player;
    #camera;
    #scene;
    #bInspector = false;
    inputMap = {};
    actions = {};
    #gameScene;
    cameraCollider;
    visibleMaterial;
    startLine;
    finishLine;


    
    #phase = 0.0;
    #vitesseY = 0.0018;

    modelsCache = {};
    
    #menuUI;
    #startTime = 0;
    #bestTime = Infinity;
    #timerActive = false;

    #groundLength = 1000;

    constructor(canvas, engine) {
        this.#canvas = canvas;
        this.#engine = engine;
        this.modelsCache ={};
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
        this.#gameScene = await this.createScene();
        await SoundManager.init();
        this.#player = new Player(0, 0, 0, 100, this.#gameScene, this.#camera);
        await this.#player.init();
        this.#player.gameObject.checkCollisions = true; // Activer les collisions pour le joueur


        // Ajout des gestionnaires de collision pour les triggers
        this.#setupTrigger(this.startLine, () => this.startTimer());
        this.#setupTrigger(this.finishLine, () => this.stopTimer());
    
        // Définir la position du joueur comme le point cible de l'ArcRotateCamera
        this.#camera.target = this.#player.gameObject.position;
        
        // this.createTriggers();
        this.initInput();
        this.setupUI();

        this.#menuUI = new MenuUI();
        await this.#menuUI.init();
        this.#menuUI.show(true);

        SoundManager.playMusic(SoundManager.Musics.START_MUSIC);
    }

    gameLoop() {
        if (!this.#camera || !this.#gameScene) {
            console.error("Camera or Game Scene not initialized.");
            return; // Stop ou reportez le gameLoop jusqu'à ce que la caméra et la scène soient prêtes
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
        



        // Création du plan qui servira de terrain
        const ground = MeshBuilder.CreateGround("ground", {width: 120, height: this.#groundLength}, this.scene);
        ground.position.x = 0;
        ground.position.y = 0 ;
        ground.position.z = -400;

        // Création du matériau et chargement de la texture
        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseTexture = new Texture(floor, this.scene);
        
        ground.material = groundMaterial;
        ground.material.diffuseTexture.uScale = 15; 
        ground.material.diffuseTexture.vScale = 90; 
        ground.receiveShadows = true;

        // Créer un mesh de collision pour la caméra
        this.cameraCollider = MeshBuilder.CreateBox("cameraCollider", { height: 2, width: 2, depth: 2 }, this.#scene);
        this.cameraCollider.isVisible = true; 
        let zoneMat = new StandardMaterial("cameraCollider", this.#scene); 
        zoneMat.diffuseColor = Color3.Red();
        this.cameraCollider.diffuseColor = zoneMat;

        // Attacher le collider à la caméra
        this.cameraCollider.parent = this.#camera;
        this.cameraCollider.position = new Vector3(0, 0, -2); // Positionner le collider devant la caméra
        this.cameraCollider.checkCollisions = true;  // Activer la détection de collisions pour le collider

        
        for(let i = 0; i < 24; i++){
            this.loadTree(this.#scene, new Vector3(45,0,90 - (i*40)));
            this.loadTree(this.#scene, new Vector3(-45,0,90 - (i*40)));
        }
        this.loadTree(this.#scene, new Vector3(15,0,90));
        this.loadTree(this.#scene, new Vector3(30,0,90));
        this.loadTree(this.#scene, new Vector3(-30,0,90));
        this.loadTree(this.#scene, new Vector3(-15,0,90));
        this.loadTree(this.#scene, new Vector3(30,0,-879));
        this.loadTree(this.#scene, new Vector3(15,0,-879));
        this.loadTree(this.#scene, new Vector3(-30,0,-879));
        this.loadTree(this.#scene, new Vector3(-15,0,-879));

        for(let i = 0; i < 16; i++){
            this.loadNature(this.#scene, new Vector3(15,0,70 - (i*60)));
            this.loadNature(this.#scene, new Vector3(-15,0,70 - (i*60)));
        }
        this.createTriggers();
        return this.#scene;
    }

    createTriggers() {
        // Matériau pour les triggers
        this.visibleMaterial = new StandardMaterial("triggerMat", this.#scene);
        this.visibleMaterial.diffuseColor = new Color3(1, 0, 0); // Rouge vif pour une bonne visibilité
    
        this.startLine = MeshBuilder.CreateBox("startLine", { height: 1, width: 20, depth: 1 }, this.#gameScene);
        this.startLine.position = new Vector3(0, 0, -10); // Proche du joueur
        this.startLine.isVisible = true; // Rendre visible pour le débogage
        this.startLine.material = this.visibleMaterial; // Appliquer le matériau rouge
    
        this.finishLine = MeshBuilder.CreateBox("finishLine", { height: 1, width: 20, depth: 1 }, this.#gameScene);
        this.finishLine.position = new Vector3(0, 0, -840); // Près de l'extrémité du terrain
        this.finishLine.isVisible = true; // Rendre visible pour le débogage
        this.finishLine.material = this.visibleMaterial; // Appliquer le matériau rouge
    }
    
    #setupTrigger(trigger, action) {
        trigger.actionManager = new ActionManager(this.#gameScene);
        trigger.actionManager.registerAction(new ExecuteCodeAction({
            trigger: ActionManager.OnIntersectionEnterTrigger,
            parameter: this.#player.gameObject
        }, action));
    }

    loadTree(scene, position) {
        SceneLoader.ImportMesh(
            "",          
            "",  
            treeUrl,
            scene,
            function (meshes) {
                let tree = meshes[0];
                tree.position = position;

                tree.scaling = new Vector3(7, 7, 7); 
    
                tree.rotation.y = Math.PI / 4;
            }
        );
    }
    
    loadNature(scene, position) {
        SceneLoader.ImportMesh(
            "",          
            "",  
            natureUrl,
            scene,
            function (meshes) {
                let tree = meshes[0];
                tree.position = position;

                tree.scaling = new Vector3(8, 8, 8);
                tree.rotation.y = Math.PI / 4;
            }
        );
    }

    setupUI() {
        const gui = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    
        const enduranceBar = new Rectangle();
        enduranceBar.width = "20%"; // Utilisation de pourcentage directement
        enduranceBar.height = "40px";
        enduranceBar.cornerRadius = 20;
        enduranceBar.color = "white";
        enduranceBar.thickness = 4;
        enduranceBar.background = "grey";
        enduranceBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        enduranceBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        enduranceBar.top = "20px";
        enduranceBar.left = "-20px";
        gui.addControl(enduranceBar);
    
        const enduranceBarFill = new Rectangle();
        enduranceBarFill.width = `${this.#player.endurance}%`;
        enduranceBarFill.height = "100%";
        enduranceBarFill.cornerRadius = 20;
        enduranceBarFill.background = "blue";
        enduranceBarFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        enduranceBar.addControl(enduranceBarFill);
    
        const label = new TextBlock();
        label.text = "Endurance";
        label.color = "white";
        label.height = "30px";
        label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        label.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        enduranceBar.addControl(label);
    
        // Affichage du temps
        const timeText = new TextBlock();
        timeText.text = "Meilleur temps: ---, Temps actuel: 0.00";
        timeText.color = "white";
        timeText.fontSize = 24;
        timeText.height = "50px";
        timeText.top = "20px";
        timeText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        timeText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        gui.addControl(timeText);

         // Ajout de l'image de guide
        const guideImage = new Image("guideImage", guideUrl);
        guideImage.width = "400px";  // Ajustez selon la taille souhaitée
        guideImage.height = "250px"; // Ajustez selon la taille souhaitée
        guideImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        guideImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guideImage.left = "-10px"; // Ajustez la marge à droite
        guideImage.top = "-10px";  // Ajustez la marge en bas
        gui.addControl(guideImage);
        console.log("Guide image added", guideImage);
    
        this.#scene.onBeforeRenderObservable.add(() => {
            if (this.#timerActive) {
                const currentTime = (Date.now() - this.#startTime) / 1000;
                timeText.text = `Temps actuel: ${currentTime.toFixed(2)}s, Meilleur temps: ${this.#bestTime.toFixed(2)}s`;
            }
            enduranceBarFill.width = `${this.#player.endurance}%`; // Mise à jour de la largeur de la barre en fonction de l'endurance du joueur
        });
    }
    
    
    startTimer() {
        if (!this.#timerActive) {
            this.#startTime = Date.now();
            this.#timerActive = true;
        }
    }
    
    stopTimer() {
        if (this.#timerActive) {
            const endTime = Date.now();
            const elapsed = (endTime - this.#startTime) / 1000; // en secondes
            if (elapsed < this.#bestTime) {
                this.#bestTime = elapsed;
            }
            this.#timerActive = false;
            console.log(`Temps actuel: ${elapsed}s, Meilleur temps: ${this.#bestTime}s`);
        }
    }

}
export default Game;