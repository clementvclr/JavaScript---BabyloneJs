import { ActionManager, Color3, Engine, ExecuteCodeAction, Material, MeshBuilder, PhysicsAggregate, PhysicsMotionType, PhysicsShape, PhysicsShapeType, SceneLoader, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";

import arenaModelUrl from "../assets/models/terrain.glb";
import { GlobalManager, States } from "./globalmanager";

class Arena {

    x;
    y;
    z;

    gameObject;
    meshAggregate;

    zoneA;
    zoneB;

    Boards_primitive1;


    constructor(x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    }

    async init() {


        const result = await SceneLoader.ImportMeshAsync("", "", arenaModelUrl, GlobalManager.scene);
        
        this.gameObject = result.meshes[0];
        this.gameObject.name = "arena";
        this.gameObject.setParent(null);
        this.gameObject.scaling.scaleInPlace(2.5);
        this.gameObject.position.set(this.x, this.y, this.z);


        for (let childMesh of result.meshes) {
            var physicsAggregate =new PhysicsAggregate(childMesh, PhysicsShapeType.MESH, { mass: 0 }, this.scene);
        }

    }
}

export default Arena;