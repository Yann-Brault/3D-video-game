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

  let ball = createBall(scene);

  scene.activeCamera = createFollowCamera(scene);
  //scene.activeCamera = freeCamera;


  createLights(scene);

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

function createFollowCamera(scene) {
  let camera = new BABYLON.ArcRotateCamera(
      "playerFollowCamera",
      BABYLON.Tools.ToRadians(-90),
      BABYLON.Tools.ToRadians(20),
      70,
      scene.getMeshByName("ball").position,
      scene
  );

  camera.attachControl(canvas, true);
  camera.panningAxis = new BABYLON.Vector3(0, 0, 0);
  camera.lockedTarget = scene.getMeshByName("PlayerSphere");
  camera.cameraAcceleration = 0.1; // how fast to move
  camera.maxCameraSpeed = 5; // speed limit

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


  //ball.physicsImpostor.applyImpulse(
  //    new BABYLON.Vector3(0, 1, 0),
  //    ball.getAbsolutePosition()
  //);



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

  pad.position.y = 2;
  pad.position.x = 6;

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
  //as soon as we click on the game window, the mouse pointer is "locked"
  //you will have to press ESC to unlock it
  /*scene.onPointerDown = () => {
    if (!scene.alreadyLocked) {
      console.log("requesting pointer lock");
      canvas.requestPointerLock();
    } else {
      console.log("Pointer already locked");
    }
  };

  document.addEventListener("pointerlockchange", () => {
    let element = document.pointerLockElement || null;
    if (element) {
      // lets create a custom attribute
      scene.alreadyLocked = true;
    } else {
      scene.alreadyLocked = false;
    }
  });*/

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
