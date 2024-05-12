import { TransformNode } from "@babylonjs/core";
import { ActionManager, Color3, Color4, Engine, FollowCamera, FreeCamera, GlowLayer, HavokPlugin, HemisphericLight, InterpolateValueAction, KeyboardEventTypes, Mesh, MeshBuilder, ParticleSystem, PhysicsAggregate, PhysicsHelper, PhysicsMotionType, PhysicsRadialImpulseFalloff, PhysicsShapeType, Scalar, Scene, SceneLoader, SetValueAction, ShadowGenerator, SpotLight, StandardMaterial, Texture, Vector3, Quaternion } from "@babylonjs/core";
import player from "../assets/models/player1.glb";
import { GlobalManager, PhysMasks } from "./globalmanager";

const SPEED = 15.0;
const USE_FORCES = true;
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.4;

class Player {

    scene;
    camera;

    transform;

    capsulAggregate;

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

    bWalking = false;
    bOnGround = false;
    bFalling = false;
    bJumping = false;

    idleAnim;
    runAnim;
    walkAnim;
    backAnim;

    constructor(x, y, z, endurance, scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.x = x || 0.0;
        this.y = y || 0.0;
        this.z = z || 0.0;
        this.transform = new MeshBuilder.CreateCapsule("player", { height: PLAYER_HEIGHT, radius: PLAYER_RADIUS }, this.scene);
        this.transform.visibility = 0.0;
        this.transform.position = new Vector3(this.x, this.y, this.z);
        
        this.endurance = endurance || 100.0;
        this.useEndurance = true;

    }

    async init() {
        //On cré le mesh et on l'attache à notre parent
        const result = await SceneLoader.ImportMeshAsync("", "", player, this.scene);
        this.gameObject = result.meshes[0];
        this.gameObject.scaling = new Vector3(1, 1, 1);
        this.gameObject.position = new Vector3(0, -PLAYER_HEIGHT / 2, 0);
        this.gameObject.rotate(Vector3.UpReadOnly, Math.PI);
        this.gameObject.bakeCurrentTransformIntoVertices();

        this.capsuleAggregate = new PhysicsAggregate(this.transform, PhysicsShapeType.CAPSULE, { mass: 1, friction: 1, restitution: 0.1 }, this.scene);
        this.capsuleAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);

        this.capsuleAggregate.body.setMassProperties({
            inertia: new Vector3(0, 0, 0),
            centerOfMass: new Vector3(0, PLAYER_HEIGHT / 2, 0),
            mass: 1,
            inertiaOrientation: new Quaternion(0, 0, 0, 1)
        });

        //On annule tous les frottements, on laisse le IF pour penser qu'on peut changer suivant le contexte
        if (USE_FORCES) {
            this.capsuleAggregate.body.setLinearDamping(0.0);
            this.capsuleAggregate.body.setAngularDamping(0.0);
        }
        else {
            this.capsuleAggregate.body.setLinearDamping(0);
            this.capsuleAggregate.body.setAngularDamping(0.0);
        }

        this.gameObject.parent = this.transform;
        this.animationsGroup = result.animationGroups;
        this.animationsGroup[0].stop();
        this.idleAnim = this.scene.getAnimationGroupByName('idle');
        this.runAnim = this.scene.getAnimationGroupByName('fast');
        this.walkAnim = this.scene.getAnimationGroupByName('run');
        this.backAnim = this.scene.getAnimationGroupByName('back');
        this.idleAnim.start(true, 1.0, this.idleAnim.from, this.idleAnim.to, false);
    }

    checkGround() {
        let ret = false;

        var rayOrigin = this.transform.absolutePosition;
        var ray1Dir = Vector3.Down();
        var ray1Len = (PLAYER_HEIGHT / 2) + 0.1;
        var ray1Dest = rayOrigin.add(ray1Dir.scale(ray1Len));

        const raycastResult = this.scene.getPhysicsEngine().raycast(rayOrigin, ray1Dest, PhysMasks.PHYS_MASK_GROUND);
        if (raycastResult.hasHit) {
            if (!this.bOnGround)
                console.log("Grounded");
            ret = true;
        }
        return ret;
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
        // Calcul des forces basées sur les entrées
    let force = new Vector3(0, 0, 0);
    if (inputMap["KeyW"]) {
        force.z += 10; // Poussée vers l'avant
    }
    if (inputMap["KeyS"]) {
        force.z -= 5; // Poussée vers l'arrière
    }
    if (inputMap["KeyA"]) {
        force.x -= 5; // Poussée vers la gauche
    }
    if (inputMap["KeyD"]) {
        force.x += 5; // Poussée vers la droite
    }

    // Application de la friction
    this.velocity.multiplyScalar(0.9); // Friction qui ralentit la vitesse

    // Calcul de l'accélération basée sur la force et la masse
    let acceleration = force.divideScalar(this.mass);

    // Mise à jour de la vitesse et de la position
    this.velocity.add(acceleration.multiplyScalar(delta));
    this.position.add(this.velocity.multiplyScalar(delta));
        
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