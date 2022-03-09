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

  let tank = scene.getMeshByName("tank");

  engine.runRenderLoop(() => {
    let deltaTime = engine.getDeltaTime();

    tank.move();
    scene.render();
  });
}

function createScene() {
  let scene = new BABYLON.scene(engine);
  let ground = createGround(scene);
  let rotateCamera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 2.5,
    15,
    new BABYLON.Vector3(0, 0, 0)
  );
  let followCamera = createFollowCamera(scene, tank);

  let tank = createTank(scene);

  scene.activeCamera = rotateCamera;

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

  const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
    "gdhm",
    "images/hmap1.png",
    groundOptions,
    scene
  );

  function onGroundCreated() {
    const groundMaterial = new BABYLON.StandardMaterial(
      "groundMaterial",
      scene
    );
    groundMaterial.diffuseTexture = new BABYLON.Texture("images/grass.jpg");
    ground.material = groundMaterial;
    // to be taken into account by collision detection
    ground.checkCollisions = true;
    //groundMaterial.wireframe=true;
  }
  return ground;
}

function createLights(scene) {
  // i.e sun light with all light rays parallels, the vector is the direction.
  let light0 = new BABYLON.DirectionalLight(
    "dir0",
    new BABYLON.Vector3(-1, -1, 0),
    scene
  );
}

function createFollowCamera(scene, target) {
  let camera = new BABYLON.FollowCamera(
    "tankFollowCamera",
    target.position,
    scene,
    target
  );

  camera.radius = 50; // how far from the object to follow
  camera.heightOffset = 14; // how high above the object to place the camera
  camera.rotationOffset = 180; // the viewing angle
  camera.cameraAcceleration = 0.1; // how fast to move
  camera.maxCameraSpeed = 5; // speed limit

  return camera;
}

function createTank(scene) {
  let tank = new BABYLON.MeshBuilder.CreateBox(
    "tank",
    { height: 4, depth: 7, width: 3 },
    scene
  );

  let tankMaterial = new BABYLON.StandardMaterial("tankMaterial", scene);
  tankMaterial.diffuseColor = new BABYLON.Color3.Red();
  tank.material = tankMaterial;

  tank.position.y = 0.6;
  tank.speed = 1;
  tank.frontVector = new BABYLON.Vector3(0, 0, 1);

  tank.move = () => {
    //tank.position.z += -1; // speed should be in unit/s, and depends on
    // deltaTime !

    // if we want to move while taking into account collision detections
    // collision uses by default "ellipsoids"

    let yMovement = 0;

    if (tank.position.y > 2) {
      zMovement = 0;
      yMovement = -2;
    }
    //tank.moveWithCollisions(new BABYLON.Vector3(0, yMovement, zMovement));

    if (inputStates.up) {
      //tank.moveWithCollisions(new BABYLON.Vector3(0, 0, 1*tank.speed));
      tank.moveWithCollisions(
        tank.frontVector.multiplyByFloats(tank.speed, tank.speed, tank.speed)
      );
    }
    if (inputStates.down) {
      //tank.moveWithCollisions(new BABYLON.Vector3(0, 0, -1*tank.speed));
      tank.moveWithCollisions(
        tank.frontVector.multiplyByFloats(-tank.speed, -tank.speed, -tank.speed)
      );
    }
    if (inputStates.left) {
      //tank.moveWithCollisions(new BABYLON.Vector3(-1*tank.speed, 0, 0));
      tank.rotation.y -= 0.02;
      tank.frontVector = new BABYLON.Vector3(
        Math.sin(tank.rotation.y),
        0,
        Math.cos(tank.rotation.y)
      );
    }
    if (inputStates.right) {
      //tank.moveWithCollisions(new BABYLON.Vector3(1*tank.speed, 0, 0));
      tank.rotation.y += 0.02;
      tank.frontVector = new BABYLON.Vector3(
        Math.sin(tank.rotation.y),
        0,
        Math.cos(tank.rotation.y)
      );
    }
  };

  return tank;
}

window.addEventListener("resize", () => {
  engine.resize();
});

function modifySettings() {
  // as soon as we click on the game window, the mouse pointer is "locked"
  // you will have to press ESC to unlock it
  scene.onPointerDown = () => {
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
  });

  // key listeners for the tank
  inputStates.left = false;
  inputStates.right = false;
  inputStates.up = false;
  inputStates.down = false;
  inputStates.space = false;

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
      } else if (event.key === " ") {
        inputStates.space = true;
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
      } else if (event.key === " ") {
        inputStates.space = false;
      }
    },
    false
  );
}
