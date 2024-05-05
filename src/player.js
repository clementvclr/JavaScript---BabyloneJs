import { TransformNode } from "@babylonjs/core";
import { ActionManager, Color3, Color4, Engine, FollowCamera, FreeCamera, GlowLayer, HavokPlugin, HemisphericLight, InterpolateValueAction, KeyboardEventTypes, Mesh, MeshBuilder, ParticleSystem, PhysicsAggregate, PhysicsHelper, PhysicsMotionType, PhysicsRadialImpulseFalloff, PhysicsShapeType, Scalar, Scene, SceneLoader, SetValueAction, ShadowGenerator, SpotLight, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";

import { Inspector } from "@babylonjs/inspector";

import girlHvmodel from "../assets/models/HVGirl.glb";
import { mrdlSliderThumbPixelShader } from "@babylonjs/gui/3D/materials/mrdl/shaders/mrdlSliderThumb.fragment";

class Player {

    scene;

    transform;

    gameObject;

    x = 0.0;
    y = 0.0;
    z = 0.0;

    endurance;

    model;

    speedX = 0.0;
    speedY = 0.0;
    speedZ = 0.0;

    maxSpeed = 40;  // Vitesse maximale atteignable lors de l'accélération
    accelerationRate = 5;  // Taux d'accélération
    enduranceConsumptionRate = 10;  // Taux de consommation de l'endurance par seconde lors de l'accélération
    enduranceRegenerationRate = 5;  // Taux de régénération de l'endurance par seconde

    constructor(x, y, z, endurance, scene) {
        this.scene = scene;
        this.x = x || 0.0;
        this.y = y || 0.0;
        this.z = z || 0.0;
        this.endurance = endurance || 100.0;
        this.transform = new TransformNode("");
        this.transform.position = new Vector3(this.x, this.y, this.z);
        this.gameObject = null;
    }

    async init() {
        //On cré le mesh et on l'attache à notre parent 
        const model = await SceneLoader.ImportMeshAsync("", "", girlHvmodel, this.scene);
        this.gameObject = model.meshes[0] /*MeshBuilder.CreateBox("", { size: 1 })*/;
        this.gameObject.parent = this.transform;
    }

    //TODO : Faire une separation en fonction afin pouvoir avoir les modficateurs qui seront sélectionner en paramètre
    //TODO : ajouter un paramètre pour la prise en charge des modificateurs

    update(inputMap, actions, delta) {
        this.deplacement(inputMap, actions, delta); // fonctionne

        this.transform.position.set(this.x, this.y, this.z);
        console.log(this.endurance);
        this.updateUI();
    }

    deplacement(inputMap, actions, delta) {
        // // Initialiser les vitesses cibles en fonction des touches de déplacement
        // let targetSpeedX = 0;
        // let targetSpeedZ = 0;
        // if (inputMap["KeyW"]) targetSpeedZ = 25;
        // if (inputMap["KeyS"]) targetSpeedZ = -25;

        // if (inputMap["KeyQ"]) {
        //     this.transform.rotate(Vector3.Up(), -0.3 * delta); // Rotation à gauche
        // }
        // if (inputMap["KeyE"]) {
        //     this.transform.rotate(Vector3.Up(), 0.3 * delta); // Rotation à droite
        // }

        // Initialiser les vitesses cibles en fonction des touches de déplacement
        let targetSpeedX = 0;
        let targetSpeedZ = 0;

        // Gérer la rotation du personnage
        if (inputMap["KeyQ"]) {
            this.transform.rotate(Vector3.Up(), -1.2 * delta); // Rotation à gauche
        }
        if (inputMap["KeyE"]) {
            this.transform.rotate(Vector3.Up(), 1.2 * delta); // Rotation à droite
        }

        // Utiliser la direction de face du personnage pour déterminer le vecteur de déplacement
        let forward = Vector3.Forward();
        forward = Vector3.TransformNormal(forward, this.transform.getWorldMatrix());
        let right = Vector3.Right();
        right = Vector3.TransformNormal(right, this.transform.getWorldMatrix());

        if (inputMap["KeyW"]) {
            targetSpeedX += forward.x * 25;
            targetSpeedZ += forward.z * 25;
        }
        if (inputMap["KeyS"]) {
            targetSpeedX -= forward.x * 25;
            targetSpeedZ -= forward.z * 25;
        }
        if (inputMap["KeyA"]) {
            targetSpeedX -= right.x * 25;
            targetSpeedZ -= right.z * 25;
        }
        if (inputMap["KeyD"]) {
            targetSpeedX += right.x * 25;
            targetSpeedZ += right.z * 25;
        }

        // Appliquer l'accélération avec la touche Shift
        if ((inputMap["ShiftLeft"] || inputMap["ShiftRight"]) && this.endurance > 0) {
            let accelerationFactor = 2;  // Multiplicateur de la vitesse lors de l'accélération
            targetSpeedX *= accelerationFactor;
            targetSpeedZ *= accelerationFactor;

            this.endurance -= this.enduranceConsumptionRate * delta;
            if (this.endurance < 0) this.endurance = 0.0;
        }

        // Gestion de l'endurance sans accélération
        else {
            if (this.endurance < 100) {
                this.endurance += this.enduranceRegenerationRate * delta;
                if (this.endurance > 100) this.endurance = 100.0;
            }
        }


        this.speedX = Math.max(Math.min(this.speedX, this.maxSpeed), -this.maxSpeed);  // Limite pour speedX
        this.speedZ = Math.max(Math.min(this.speedZ, this.maxSpeed), -this.maxSpeed);  // Limite pour speedZ


        // Appliquer un facteur de lissage pour les vitesses 
        this.speedX += (targetSpeedX - this.speedX) * this.accelerationRate * delta;
        this.speedZ += (targetSpeedZ - this.speedZ) * this.accelerationRate * delta;

        // Mouvement
        this.x += this.speedX * delta;
        this.z += this.speedZ * delta;

        // Gestion du saut
        if (actions["Space"] && this.y <= 2.0 && this.speedY < 0) this.speedY = 50.0;
        //Check collisions 
        if (this.x > 400) this.x = 400;
        else if (this.x < -400) this.x = -400;
        if (this.z > 400) this.z = 400;
        else if (this.z < -400) this.z = -400;
        if (this.y < 1) this.y = 1;
    }

    updateUI() {
        document.getElementById('currentSpeed').innerText = `Vitesse: X: ${this.speedX.toFixed(2)}, Y: ${this.speedY.toFixed(2)}, Z: ${this.speedZ.toFixed(2)}`;
        document.getElementById('currentEndurance').innerText = `Endurance: ${this.endurance.toFixed(2)}`;
        document.getElementById('positionX').innerText = `Position X: ${this.x.toFixed(2)}`;
        document.getElementById('positionY').innerText = `Position Y: ${this.y.toFixed(2)}`;
        document.getElementById('positionZ').innerText = `Position Z: ${this.z.toFixed(2)}`;
    }

}

export default Player;