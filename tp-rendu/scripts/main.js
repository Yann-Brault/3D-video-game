let canvas;
let engine;
let scene;

let inputStates = {};

window.onload = startGame;

function startGame() {
  canvas = document.querySelector("#myCanvas");
  engine = new BABYLON.engine(canvas, true);
  scene = createScene();

  var gravityVector = new BABYLON.Vectro3(0, -9.81, 0);
  var physicsPlugin = new BABYLON.CannonJSPlugin();

  scene.enablePhysics(gravityVector, physicsPlugin);

  modifySettings();

  engine.runRenderLoop(() => {
    scene.render();
  });
}

function createScene() {
  let scene = new BABYLON.scene(engine);
  let ground = createGround(scene);
  let freeCamera = createFreeCamera(scene);

  let ball = createBall(scene);

  scene.activeCamera = freeCamera;

  createLights(scene);

  return scene;
}

function createGround(scene) {
  const groundOptions = {
    width: 2000,
    height: 2000,
    subdivisions: 20,
    minHeight: 0,
    maxHeight: 100,
    onReady: onGroundCreated
  };

  const ground = BABYLON.MeshBuilder;
}
