import { Engine } from "@babylonjs/core";
import { Inspector } from "@babylonjs/inspector";
import Game from "./game";

import MainMenu from "../assets/picture/menu.jpg";

let canvas;
let engine;

const babylonInit = async () => {
    canvas = document.getElementById("renderCanvas");
    engine = new Engine(canvas, false, {
        adaptToDeviceRatio: true,
    });
    window.addEventListener("resize", function () {
        engine.resize();
    });
};

window.onload = () => {
    babylonInit().then(() => {
    const game = new Game(canvas, engine);
        game.start();
    });
}