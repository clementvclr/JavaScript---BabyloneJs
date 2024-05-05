import Player from './player';

class Enemy extends Player{

    #levelAI;

    constructor(x, y, z, endurance, scene, levelAI){
        super(x, y, z, endurance, scene);
        
    }

}