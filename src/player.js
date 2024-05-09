import { TransformNode } from "@babylonjs/core";
import { ActionManager, Color3, Color4, Engine, FollowCamera, FreeCamera, GlowLayer, HavokPlugin, HemisphericLight, InterpolateValueAction, KeyboardEventTypes, Mesh, MeshBuilder, ParticleSystem, PhysicsAggregate, PhysicsHelper, PhysicsMotionType, PhysicsRadialImpulseFalloff, PhysicsShapeType, Scalar, Scene, SceneLoader, SetValueAction, ShadowGenerator, SpotLight, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import { Inspector } from "@babylonjs/inspector";

import girlHvmodel from "../assets/models/HVGirl.glb";
import { mrdlSliderThumbPixelShader } from "@babylonjs/gui/3D/materials/mrdl/shaders/mrdlSliderThumb.fragment";
const SPEED = 15.0;
class Player {

    scene;
    camera;

    transform;

    axes;

    gameObject;

    x = 0.0;
    y = 0.0;
    z = 0.0;

    endurance;

    model;

    //vecteur d'input
    moveInput = new Vector3(0,0,0);
    //vecteur de deplacement
    moveDirection= new Vector3(0,0,0);

    speedX = 0.0;
    speedY = 0.0;
    speedZ = 0.0;

    maxSpeed = 40;  // Vitesse maximale atteignable lors de l'accélération
    accelerationRate = 5;  // Taux d'accélération
    enduranceConsumptionRate = 10;  // Taux de consommation de l'endurance par seconde lors de l'accélération
    enduranceRegenerationRate = 5;  // Taux de régénération de l'endurance par seconde

    constructor(x, y, z, endurance, scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.x = x || 0.0;
        this.y = y || 0.0;
        this.z = z || 0.0;
        this.endurance = endurance || 100.0;
        this.transform = new TransformNode("");
        this.transform.position = new Vector3(this.x, this.y, this.z);
        this.gameObject = null;
    }

    async init() {
        if (this.gameObject) return;
        //On cré le mesh et on l'attache à notre parent 
        const model = await SceneLoader.ImportMeshAsync("", "", girlHvmodel, this.scene);
        this.gameObject = model.meshes[0] /*MeshBuilder.CreateBox("", { size: 1 })*/;
        this.gameObject.parent = this.transform;

    }

    //TODO : Faire une separation en fonction afin pouvoir avoir les modficateurs qui seront sélectionner en paramètre
    //TODO : ajouter un paramètre pour la prise en charge des modificateurs

    update(inputMap, actions, delta) {
        this.getInputs( inputMap, actions);
        this.applyCameraToInputs();
        this.move(delta);
        console.log(this.endurance);
        this.updateUI();
    }

    getInputs(inputMap, actions) {
        this.moveInput.set(0, 0, 0);
        
        if (inputMap["KeyA"]) {
            this.moveInput.x = -1;
        }
        else if (inputMap["KeyD"]) {
            this.moveInput.x = 1;
        }

        
        if (inputMap["KeyW"]) {
            this.moveInput.z = 1;
        }
        else if (inputMap["KeyS"]) {
            this.moveInput.z = -1;
        }

        if (actions["Space"]) {
            this.moveInput.y = 1;
        }

        // Appliquer l'accélération avec la touche Shift
        // if ((inputMap["ShiftLeft"] || inputMap["ShiftRight"]) && this.endurance > 0) {
        //     let accelerationFactor = 2;  // Multiplicateur de la vitesse lors de l'accélération
        //     targetSpeedX *= accelerationFactor;
        //     targetSpeedZ *= accelerationFactor;

        //     this.endurance -= this.enduranceConsumptionRate * delta;
        //     if (this.endurance < 0) this.endurance = 0.0;
        // }

        // Gestion de l'endurance sans accélération
        // else {
        //     if (this.endurance < 100) {
        //         this.endurance += this.enduranceRegenerationRate * delta;
        //         if (this.endurance > 100) this.endurance = 100.0;
        //     }
        // }


        // this.speedX = Math.max(Math.min(this.speedX, this.maxSpeed), -this.maxSpeed);  // Limite pour speedX
        // this.speedZ = Math.max(Math.min(this.speedZ, this.maxSpeed), -this.maxSpeed);  // Limite pour speedZ


        // // Appliquer un facteur de lissage pour les vitesses 
        // this.speedX += (targetSpeedX - this.speedX) * this.accelerationRate * delta;
        // this.speedZ += (targetSpeedZ - this.speedZ) * this.accelerationRate * delta;

        // // Mouvement
        // this.x += this.speedX * delta;
        // this.z += this.speedZ * delta;

        // // Gestion du saut
        // if (actions["Space"] && this.y <= 2.0 && this.speedY < 0) this.speedY = 50.0;
        // //Check collisions 
        // if (this.x > 400) this.x = 400;
        // else if (this.x < -400) this.x = -400;
        // if (this.z > 400) this.z = 400;
        // else if (this.z < -400) this.z = -400;
        // if (this.y < 1) this.y = 1;
    }
   
    applyCameraToInputs() {
        
        this.moveDirection.set(0, 0, 0);

        if (this.moveInput.length() != 0) {

            //Recup le forward de la camera
            let forward = this.getForwardVector(this.camera);
            forward.y = 0;
            forward.normalize();
            forward.scaleInPlace(this.moveInput.z);

            //Recup le right de la camera
            let right = this.getRightVector(this.camera);
            right.y = 0;
            right.normalize();
            right.scaleInPlace(this.moveInput.x);

            //Add les deux vect
            this.moveDirection = right.add(forward);

            this.moveDirection.normalize();

            
        }
    }

    move(delta){
        if (this.moveDirection.length() !== 0) {

            this.moveDirection.scaleInPlace(SPEED * delta);

            this.gameObject.position.addInPlace(this.moveDirection);
            
        }
    }

    getUpVector(_mesh) {
        _mesh.computeWorldMatrix(true);
        var up_local = new Vector3(0,1,0);
        const worldMatrix = _mesh.getWorldMatrix();
        return Vector3.TransformNormal(up_local, worldMatrix);
    }

    getForwardVector(_mesh) {
        _mesh.computeWorldMatrix(true);
        var forward_local = new Vector3(0,0,1);
        const worldMatrix = _mesh.getWorldMatrix();
        return Vector3.TransformNormal(forward_local, worldMatrix);
    }

    getRightVector(_mesh) {
        _mesh.computeWorldMatrix(true);
        var right_local = new Vector3(1,0,0);
        const worldMatrix = _mesh.getWorldMatrix();
        return Vector3.TransformNormal(right_local, worldMatrix);
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