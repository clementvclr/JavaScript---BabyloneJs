class Game {

    #canvas;
    #engine;

    constructor(canvas, engine) {
        this.#canvas = canvas;
        this.#engine = engine;
    }

    start() {
        const scene = this.createScene();
            this.#engine.runRenderLoop(function () {
            scene.render();
        });
    }

    createScene() {
        const scene = new Scene(this.#engine);
        const camera = new FreeCamera("camera1",
            new Vector3(0, 5, -10), scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(this.#canvas, true);
        const light = new HemisphericLight("light",
            new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
        const sphere = MeshBuilder.CreateSphere("sphere",
        {diameter: 2, segments: 32}, scene);
        sphere.position.y = 1;
        const ground = MeshBuilder.CreateGround("ground",
        {width: 6, height: 6}, scene);
        return scene;
    }
        
}

export default Game;