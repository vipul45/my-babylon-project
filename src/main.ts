import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  SceneLoader,
  ExecuteCodeAction,
  ActionManager,
  PhotoDome,
  FollowCamera
} from "@babylonjs/core";
import "@babylonjs/loaders";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true);
const scene = new Scene(engine);
new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);

const camera = new FollowCamera("followCamera", new Vector3(0, 1, -10), scene);
camera.radius = 10; // how far from the object to follow
camera.heightOffset = 4; // how high above the object to place the camera
camera.rotationOffset = 0; // the viewing angle
camera.cameraAcceleration = 0.05; // how fast to move
camera.maxCameraSpeed = 10; // speed limit

camera.attachControl();

engine.runRenderLoop(() => {
  scene.render();
});
window.addEventListener("resize", () => {
  engine.resize();
});
scene.createDefaultEnvironment({
  createGround: false,
  createSkybox: false
});

// Create the PhotoDome with higher resolution
const imageUrl = "/textures/church360.jpg"; // replace with your 360 image URL
let dome = new PhotoDome(
  "sphere",
  imageUrl,
  {
    resolution: 32, // Increase resolution
    size: 500,       // Adjust size as needed
    useDirectMapping: false
  },
  scene
);

camera.wheelPrecision = 10;
var inputMap = {};
scene.actionManager = new ActionManager(scene);
scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, function (evt) {
  inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
}));
scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, function (evt) {
  inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
}));

const loadModel = async () => {
  const model = await SceneLoader.ImportMeshAsync(null, "https://assets.babylonjs.com/meshes/", "HVGirl.glb", scene);
  const player = model.meshes[0];
  player.scaling.setAll(0.1);
  
  camera.lockedTarget = player; // target the player
  
  let animating = false;

  const walkAnim = scene.getAnimationGroupByName("Walking");
  const walkBackAnim = scene.getAnimationGroupByName("WalkingBack");
  const idleAnim = scene.getAnimationGroupByName("Idle");
  const sambaAnim = scene.getAnimationGroupByName("Samba");

  const playerWalkSpeed = 0.1;
  const playerSpeedBackwards = 0.05;
  const playerRotationSpeed = 0.03;

  scene.onBeforeRenderObservable.add(() => {
    var keydown = false;
    // Manage the movements of the character (e.g. position, direction)
    if (inputMap["w"]) {
      player.moveWithCollisions(player.forward.scaleInPlace(playerWalkSpeed));
      keydown = true;
    }
    if (inputMap["s"]) {
      player.moveWithCollisions(player.forward.scaleInPlace(-playerSpeedBackwards));
      keydown = true;
    }
    if (inputMap["a"]) {
      player.rotate(Vector3.Up(), -playerRotationSpeed);
      keydown = true;
    }
    if (inputMap["d"]) {
      player.rotate(Vector3.Up(), playerRotationSpeed);
      keydown = true;
    }
    if (inputMap["b"]) {
      keydown = true;
    }

    // Manage animations to be played
    if (keydown) {
      if (!animating) {
        animating = true;
        if (inputMap["s"]) {
          // Walk backwards
          walkBackAnim.start(true, 1.0, walkBackAnim.from, walkBackAnim.to, false);
        } else if (inputMap["b"]) {
          // Samba!
          sambaAnim.start(true, 1.0, sambaAnim.from, sambaAnim.to, false);
        } else {
          // Walk
          walkAnim.start(true, 1.0, walkAnim.from, walkAnim.to, false);
        }
      }
    } else {
      if (animating) {
        // Default animation is idle when no key is down
        idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);

        // Stop all animations besides Idle Anim when no key is down
        sambaAnim.stop();
        walkAnim.stop();
        walkBackAnim.stop();

        // Ensure animations are played only once per rendering loop
        animating = false;
      }
    }
  });
}

loadModel();
