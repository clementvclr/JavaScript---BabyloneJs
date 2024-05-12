import { TransformNode } from "@babylonjs/core";
import { ActionManager, Color3, Color4, Engine, FollowCamera, FreeCamera, GlowLayer, HavokPlugin, HemisphericLight, InterpolateValueAction, KeyboardEventTypes, Mesh, MeshBuilder, ParticleSystem, PhysicsAggregate, PhysicsHelper, PhysicsMotionType, PhysicsRadialImpulseFalloff, PhysicsShapeType, Scalar, Scene, SceneLoader, SetValueAction, ShadowGenerator, SpotLight, StandardMaterial, Texture, Vector3, Quaternion } from "@babylonjs/core";
import player from "../assets/models/player1.glb";

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
    useEndurance;

    //vecteur d'input
    moveInput = new Vector3(0,0,0);
    //vecteur de deplacement
    moveDirection= new Vector3(0,0,0);

    speedX = 0.0;
    speedY = 0.0;
    speedZ = 0.0;

    maxSpeed = 40;  // Vitesse maximale atteignable lors de l'accélération
    accelerationRate = 5;  // Taux d'accélération
    enduranceConsumptionRate = 25;  // Taux de consommation de l'endurance par seconde lors de l'accélération
    enduranceRegenerationRate = 2;  // Taux de régénération de l'endurance par seconde

    animations;

    constructor(x, y, z, endurance, scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.x = x || 0.0;
        this.y = y || 0.0;
        this.z = z || 0.0;
        this.animations = {};
        this.endurance = endurance || 100.0;
        this.useEndurance = true;
        this.transform = new TransformNode("");
        this.transform.position = new Vector3(this.x, this.y, this.z);
        this.gameObject = null;
    }

    async init() {
        try {
            const { meshes, skeletons, animationGroups } = await SceneLoader.ImportMeshAsync("", "", player, this.scene);
            this.gameObject = meshes[0];

            this.transform = new TransformNode("playerTransform", this.scene);
            this.gameObject.parent = this.transform;

            animationGroups.forEach(group => {
                this.animations[group.name] = group;
            });
            this.animations["idle"].play(true);
        } 
        catch (error) {
            console.error("Erreur lors du chargement du modèle : ", error);
        }

    }
    //TODO : Faire une separation en fonction afin pouvoir avoir les modficateurs qui seront sélectionner en paramètre
    //TODO : ajouter un paramètre pour la prise en charge des modificateurs

    update(inputMap, actions, delta) {
        this.transform.position.set(this.x, this.y, this.z);
        this.getInputs( inputMap, actions, delta);
        this.applyCameraToInputs();
        this.move(delta);
        this.updateUI();
        
        if (Math.abs(this.moveInput.x) >= 1 || Math.abs(this.moveInput.z) >= 1) {
            if ((inputMap["ShiftLeft"] || inputMap["ShiftRight"]) && this.useEndurance && inputMap["KeyW"]) {
                this.playAnimation("fast");
            } else if(this.moveInput.z < 0){
                this.playAnimation("back");
            } else {
                this.playAnimation("run");
            }
        } 
        else {
            this.playAnimation("idle");
        }
    }

    getInputs(inputMap, actions,delta) {
        this.moveInput.set(0, 0, 0);

        
        if ((inputMap["ShiftLeft"] || inputMap["ShiftRight"]) && this.endurance > 0 && this.useEndurance && inputMap["KeyW"]) {
            if (inputMap["KeyA"]) {
                this.moveInput.x = -1;
            }
            else if (inputMap["KeyD"]) {
                this.moveInput.x = 1;
            }
            if (inputMap["KeyW"]) {
                this.moveInput.z = 5;
                this.endurance -= this.enduranceConsumptionRate * delta;
            }
            else if (inputMap["KeyS"]) {
                this.moveInput.z = -1;
            }

            if (actions["Space"]) {
                this.moveInput.y = 1;
            }
            if (this.endurance < 0) {
                this.useEndurance = false;
                this.endurance = 0.0;
            }
        }
        else{
            if (this.endurance >= 10) this.useEndurance = true;
            if (this.endurance < 100) {
                    this.endurance += this.enduranceRegenerationRate * delta;
                    if (this.endurance > 100) this.endurance = 100.0;
            }
            if (inputMap["KeyA"]) {
                this.moveInput.x = -1;
            }
            else if (inputMap["KeyD"]) {
                this.moveInput.x = 1;
            }
            if (inputMap["KeyW"]) {
                this.moveInput.z = 2;
            }
            else if (inputMap["KeyS"]) {
                this.moveInput.z = -1;
            }

            if (actions["Space"]) {
                this.moveInput.y = 1;
            }
        }
    }
   
    setRotationY(angle) {
        if (this.gameObject && this.gameObject.rotationQuaternion) {
            this.gameObject.rotationQuaternion = Quaternion.FromEulerAngles(0, angle, 0);
        } else if (this.gameObject) {
            this.gameObject.rotation.y = angle;
        }
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
            
            //normalise
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
        document.getElementById('positionX').innerText = `Position X: ${this.moveInput.x.toFixed(2)}`;
        document.getElementById('positionY').innerText = `Position Y: ${this.moveInput.y.toFixed(2)}`;
        document.getElementById('positionZ').innerText = `Position Z: ${this.moveInput.z.toFixed(2)}`;
    }

    playAnimation(name) {
        // Arrêter toutes les animations sauf celle à jouer
        for (let key in this.animations) {
            if (key === name) {
                if (!this.animations[key].isPlaying) {
                    this.animations[key].play(true);
                }
            } else {
                this.animations[key].stop();
            }
        }
    }
}
export default Player;