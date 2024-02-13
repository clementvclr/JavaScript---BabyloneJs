import { MeshBuilder, TransformNode, Vector3 } from "@babylonjs/core";

class Player{

    scene;

    transform;

    gameObject;

    x = 0.0; 
    y = 0.0; 
    z = 0.0; 
    
    speedX = 0.0; 
    speedY = 0.0; 
    speedZ = 0.0;

    constructor(x, y, z, scene) { 
        this.scene = scene; 
        this.x = x || 0.0; 
        this.y = y || 0.0; 
        this.z = z || 0.0; 
        this.transform = new TransformNode(""); 
        this.transform.position = new Vector3(this.x, this.y, this.z); 
    } 
    
    async init() { 
        //On cré le mesh et on l'attache à notre parent 
        this.gameObject = MeshBuilder.CreateBox("player", { size: 2 }); 
        this.gameObject.parent = this.transform; 
    }

    update(inputMap, actions, delta) { 
        //Inputs 
        if (inputMap["KeyA"]) 
            this.speedX = -25; 
        else if (inputMap["KeyD"]) 
            this.speedX = 25; 
        else { 
            //Frottements 
            this.speedX += (-10.0 * this.speedX * delta); 
        }
        if (inputMap["KeyW"]) 
            this.speedZ = 25; 
        else if (inputMap["KeyS"]) 
            this.speedZ = -25; 
        else { 
            //Frottements 
            this.speedZ += (-10.0 * this.speedZ * delta); 
        }
        if (actions["Space"]) { 
            //Pas de delta ici, c'est une impulsion non dépendante du temps (pas d'ajout) 
            //On autorise le saut meme si on es pas vraiment sur le sol (presque) a condition d'etre en train de tomber 
            if (this.y <= 2.0 && this.speedY < 0) this.speedY = 50; 
        }

        this.speedY = this.speedY - (100 * delta);
        //Move 
        this.x += this.speedX * delta; 
        this.y += this.speedY * delta; 
        this.z += this.speedZ * delta;

        //Check collisions 
        if (this.x > 30) this.x = 30; 
        else if (this.x < -30) this.x = -30; 
        if (this.z > 30) this.z = 30; 
        else if (this.z < -30) this.z = -30; 
        if (this.y < 1) this.y = 1;

        this.transform.position.set(this.x, this.y, this.z);
    }

}

export default Player;