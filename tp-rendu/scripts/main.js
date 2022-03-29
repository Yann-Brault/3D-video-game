let canvas;
let engine;
let scene;

let inputStates = {};

window.onload = startGame;

function startGame() {
  canvas = document.querySelector("#myCanvas");
  engine = new BABYLON.Engine(canvas, true);
  scene = createScene();

  modifySettings();
  let ball = scene.getMeshByName("ball");

  engine.runRenderLoop(() => {
    let deltaTime = engine.getDeltaTime();
    ball.move();
    scene.render();
  });
}

function createScene() {
  let scene = new BABYLON.Scene(engine);
  let gravityVector = new BABYLON.Vector3(0, -9.81, 0);
  let physicsPlugin = new BABYLON.CannonJSPlugin();

  scene.enablePhysics(gravityVector, physicsPlugin);
  //scene.enablePhysics();
  let ground = createGround(scene);
  let box = createBox(scene);
  let pad = createJumpPad(scene);
  pad.position = new BABYLON.Vector3 (10, 2, -10);
  let pad2 = createJumpPad(scene);
  pad2.position = new BABYLON.Vector3(10, 2, 10);
  let pad3 = createJumpPad(scene);
  pad3.position = new BABYLON.Vector3(-10, 2, 10);
  let pad4 = createJumpPad(scene);
  pad4.position = new  BABYLON.Vector3(-10, 2, -10);
  let ball = createBall(scene);
  createLights(scene);
  scene.activeCamera = createCamera(scene);

  ball.actionManager = new BABYLON.ActionManager(scene);

  ball.actionManager.registerAction(new BABYLON.SetValueAction(
      { trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger, parameter: pad },
      ball, "scaling", new BABYLON.Vector3(1.5, 1.5, 1.5)));
  ball.actionManager.registerAction(new BABYLON.SetValueAction(
      { trigger: BABYLON.ActionManager.OnIntersectionExitTrigger, parameter: pad },
      ball, "scaling", new BABYLON.Vector3(1, 1, 1)));

  ball.actionManager.registerAction(new BABYLON.SetValueAction(
      {trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger, parameter: pad2},
      ball.material, "diffuseColor",  BABYLON.Color3.White()));
  ball.actionManager.registerAction(new BABYLON.SetValueAction(
      {trigger: BABYLON.ActionManager.OnIntersectionExitTrigger, parameter: pad2},
      ball.material, "diffuseColor",  ball.material.diffuseColor));

  ball.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      {trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger, parameter: pad3},
      () => {
        console.log("function")
        ball.physicsImpostor.applyImpulse(
            new BABYLON.Vector3(2, 10, 2),
            ball.getAbsolutePosition()
        );
      }
  ));

  ball.actionManager.registerAction(new BABYLON.SetValueAction(
      { trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger, parameter: pad4},
      pad4, "scaling", new BABYLON.Vector3(0.5, 0.5, 0.5)
  ));

  ball.actionManager.registerAction(new BABYLON.SetValueAction(
      { trigger: BABYLON.ActionManager.OnIntersectionExitTrigger, parameter: pad4},
      pad4.material, "diffuseColor", BABYLON.Color3.Random()
  ));

  ball.actionManager.registerAction((new BABYLON.PlaySoundAction(
      {trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger, parameter: box},
      new BABYLON.Sound("explosion", "sounds/explosion.mp3", scene)
  )));


  return scene;
}

function createGround(scene) {
  let ground = BABYLON.Mesh.CreateGround("ground1", 50, 50, 2, scene);
  let groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
  groundMaterial.diffuseColor = new BABYLON.Color3.Black();
  ground.material = groundMaterial;

  ground.physicsImpostor = new BABYLON.PhysicsImpostor(
      ground,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0.9 },
      scene
  );

  return ground;
}

function createLights(scene) {
  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new BABYLON.HemisphericLight(
    "light1",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;
}

function createCamera(scene) {
  let camera = new BABYLON.ArcRotateCamera(
      "Camera",
      BABYLON.Tools.ToRadians(-90),
      BABYLON.Tools.ToRadians(20),
      70,
      scene.getMeshByName("ball").position,
      scene
  );

  camera.attachControl(canvas,true);
  camera.panningAxis = new BABYLON.Vector3(0, 0, 0);
  camera.cameraAcceleration = 0.1; // how fast to move
  camera.maxCameraSpeed = 5; // speed limit
  camera.lowerBetaLimit = 0.1;
  camera.upperBetaLimit = (Math.PI / 2) * 0.99;
  camera.lowerRadiusLimit = 15;

  return camera;
}

let zMovement = 5;
function createBall(scene) {
  let ball = BABYLON.Mesh.CreateSphere("ball", 10, 2, scene);
  let ballMaterial = new BABYLON.StandardMaterial("ballMaterial", scene);
  ballMaterial.diffuseColor = new BABYLON.Color3.Red();
  ball.material = ballMaterial;

  ball.position.y = 10;

  ball.physicsImpostor = new BABYLON.PhysicsImpostor(
      ball,
      BABYLON.PhysicsImpostor.SphereImpostor,
      { mass: 10, nativeOptions: { linearDamping: 0.35, angularDamping: 0.35 }  },
      scene
  );

  ball.move = () => {
    let camera = scene.activeCamera;
    ball.frontVector = camera
        .getDirection(new BABYLON.Vector3(0, 0, 1))
        .normalizeFromLength(0);
    let forceMagnitude = 500;
    let contactLocalRefPoint = BABYLON.Vector3.Zero();
    let forceDirection = BABYLON.Vector3.Zero();

    if (inputStates.up) {
      forceDirection = ball.frontVector;
    }
    if (inputStates.down) {
      forceDirection = ball.frontVector.negate();
    }
    if (inputStates.left) {
      forceDirection.x = -ball.frontVector.z;
      forceDirection.z = ball.frontVector.x;
    }
    if (inputStates.right) {
      forceDirection.x = ball.frontVector.z;
      forceDirection.z = -ball.frontVector.x;
    }
    forceDirection.y = 0;
    //console.log(forceDirection);
    ball.physicsImpostor.applyForce(
        forceDirection.scale(forceMagnitude),
        ball.getAbsolutePosition().add(contactLocalRefPoint)
    );
  };

  return ball;
}

function createBox(scene) {
  let box = BABYLON.Mesh.CreateBox("box", 8, scene);
  let boxMaterial = new BABYLON.StandardMaterial("boxMaterial", scene);
  boxMaterial.diffuseColor = new BABYLON.Color3.Blue();
  box.material = boxMaterial;
  box.position.y = 4;

  box.physicsImpostor = new BABYLON.PhysicsImpostor(
      box,
      BABYLON.PhysicsImpostor.BoxImpostor,
      {mass: 0, restitution: 0.5},
      scene
  );

  return box;
}

function createJumpPad(scene) {
  let pad = BABYLON.Mesh.CreateBox("pad", 4, scene);
  let padMaterial = new BABYLON.StandardMaterial("padMaterial", scene);
  padMaterial.diffuseColor = new BABYLON.Color3.Green();
  pad.material = padMaterial;

  pad.physicsImpostor = new BABYLON.PhysicsImpostor(
      pad,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0.5 },
      scene
  );

  return pad;
}

window.addEventListener("resize", () => {
  engine.resize();
});

function modifySettings() {

  // key listeners for the tank
  inputStates.left = false;
  inputStates.right = false;
  inputStates.up = false;
  inputStates.down = false;

  //add the listener to the main, window object, and update the states
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "ArrowLeft" || event.key === "q" || event.key === "Q") {
        inputStates.left = true;
      } else if (
        event.key === "ArrowUp" ||
        event.key === "z" ||
        event.key === "Z"
      ) {
        inputStates.up = true;
      } else if (
        event.key === "ArrowRight" ||
        event.key === "d" ||
        event.key === "D"
      ) {
        inputStates.right = true;
      } else if (
        event.key === "ArrowDown" ||
        event.key === "s" ||
        event.key === "S"
      ) {
        inputStates.down = true;
      }
    },
    false
  );

  //if the key will be released, change the states object
  window.addEventListener(
    "keyup",
    (event) => {
      if (event.key === "ArrowLeft" || event.key === "q" || event.key === "Q") {
        inputStates.left = false;
      } else if (
        event.key === "ArrowUp" ||
        event.key === "z" ||
        event.key === "Z"
      ) {
        inputStates.up = false;
      } else if (
        event.key === "ArrowRight" ||
        event.key === "d" ||
        event.key === "D"
      ) {
        inputStates.right = false;
      } else if (
        event.key === "ArrowDown" ||
        event.key === "s" ||
        event.key === "S"
      ) {
        inputStates.down = false;
      }
    },
    false
  );
}
