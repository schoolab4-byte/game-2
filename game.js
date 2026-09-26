const canvas = document.getElementById("gameCanvas");

const engine = new BABYLON.Engine(canvas, true);

let scene;
let camera;

let score = 0;
let health = 100;

let drones = [];
let gameStarted = false;

const scoreText = document.getElementById("score");
const healthText = document.getElementById("health");
const targetsText = document.getElementById("targets");

const startButton = document.getElementById("startButton");
const instructions = document.getElementById("instructions");
const gameOver = document.getElementById("gameOver");
const finalScore = document.getElementById("finalScore");


function createScene() {

    scene = new BABYLON.Scene(engine);

    scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.06, 1);

    // CAMERA
    camera = new BABYLON.UniversalCamera(
        "playerCamera",
        new BABYLON.Vector3(0, 2, -12),
        scene
    );

    camera.attachControl(canvas, true);

    camera.speed = 0.35;
    camera.angularSensibility = 3000;

    camera.minZ = 0.1;

    // LIGHT
    const light = new BABYLON.HemisphericLight(
        "mainLight",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );

    light.intensity = 0.9;

    // GROUND
    const ground = BABYLON.MeshBuilder.CreateGround(
        "ground",
        {
            width: 60,
            height: 60
        },
        scene
    );

    const groundMaterial = new BABYLON.StandardMaterial(
        "groundMaterial",
        scene
    );

    groundMaterial.diffuseColor =
        new BABYLON.Color3(0.08, 0.08, 0.12);

    ground.material = groundMaterial;

    // ARENA WALLS
    createWall(0, 3, 30, 1);
    createWall(0, 3, -30, 1);
    createWall(30, 3, 0, 1);
    createWall(-30, 3, 0, 1);

    // ARENA BLOCKS
    createBlock(-8, 2, 5);
    createBlock(8, 2, 5);
    createBlock(-10, 2, -5);
    createBlock(10, 2, -5);

    return scene;
}


// CREATE WALL
function createWall(x, y, z, dummy) {

    let wall;

    if (x === 0) {
        wall = BABYLON.MeshBuilder.CreateBox(
            "wall",
            {
                width: 60,
                height: 6,
                depth: 1
            },
            scene
        );
    } else {
        wall = BABYLON.MeshBuilder.CreateBox(
            "wall",
            {
                width: 1,
                height: 6,
                depth: 60
            },
            scene
        );
    }

    wall.position = new BABYLON.Vector3(x, y, z);

    const material = new BABYLON.StandardMaterial(
        "wallMaterial",
        scene
    );

    material.diffuseColor =
        new BABYLON.Color3(0.12, 0.15, 0.2);

    wall.material = material;
}


// CREATE COVER BLOCK
function createBlock(x, y, z) {

    const block = BABYLON.MeshBuilder.CreateBox(
        "cover",
        {
            width: 4,
            height: 4,
            depth: 4
        },
        scene
    );

    block.position = new BABYLON.Vector3(x, y, z);

    const material = new BABYLON.StandardMaterial(
        "blockMaterial",
        scene
    );

    material.diffuseColor =
        new BABYLON.Color3(0.15, 0.2, 0.3);

    block.material = material;
}


// CREATE TRAINING DRONE
function createDrone() {

    if (!gameStarted) return;

    const drone = BABYLON.MeshBuilder.CreateSphere(
        "trainingDrone",
        {
            diameter: 1.5
        },
        scene
    );

    const x = Math.random() * 35 - 17.5;
    const z = Math.random() * 35 - 17.5;

    drone.position = new BABYLON.Vector3(
        x,
        1.5,
        z
    );

    const material = new BABYLON.StandardMaterial(
        "droneMaterial",
        scene
    );

    material.diffuseColor =
        new BABYLON.Color3(0.1, 0.7, 1);

    material.emissiveColor =
        new BABYLON.Color3(0, 0.25, 0.5);

    drone.material = material;

    drone.health = 1;

    drones.push(drone);

    updateHUD();
}


// SHOOT
function shoot() {

    if (!gameStarted) return;

    const ray = scene.createPickingRay(
        engine.getRenderWidth() / 2,
        engine.getRenderHeight() / 2,
        BABYLON.Matrix.Identity(),
        camera
    );

    const hit = scene.pickWithRay(ray);

    if (
        hit.hit &&
        hit.pickedMesh &&
        hit.pickedMesh.name === "trainingDrone"
    ) {

        const drone = hit.pickedMesh;

        drone.dispose();

        drones = drones.filter(d => d !== drone);

        score += 10;

        updateHUD();

        createHitEffect(hit.pickedPoint);
    }
}


// ENERGY HIT EFFECT
function createHitEffect(position) {

    const effect = BABYLON.MeshBuilder.CreateSphere(
        "hitEffect",
        {
            diameter: 0.3
        },
        scene
    );

    effect.position = position;

    const material = new BABYLON.StandardMaterial(
        "effectMaterial",
        scene
    );

    material.emissiveColor =
        new BABYLON.Color3(0, 0.8, 1);

    effect.material = material;

    let size = 0.3;

    const observer = scene.onBeforeRenderObservable.add(() => {

        size += 0.15;

        effect.scaling =
            new BABYLON.Vector3(size, size, size);

        if (size > 2) {

            scene.onBeforeRenderObservable.remove(observer);

            effect.dispose();
        }
    });
}


// DRONE MOVEMENT
function updateDrones() {

    if (!gameStarted) return;

    drones.forEach(drone => {

        if (drone.isDisposed()) return;

        drone.rotation.y += 0.03;

        const direction =
            camera.position.subtract(drone.position);

        direction.y = 0;

        if (direction.length() > 0.1) {

            direction.normalize();

            drone.position.addInPlace(
                direction.scale(0.008)
            );
        }

        // Drone reaches player
        if (
            BABYLON.Vector3.Distance(
                drone.position,
                camera.position
            ) < 2
        ) {

            health -= 5;

            drone.dispose();

            drones = drones.filter(d => d !== drone);

            updateHUD();

            if (health <= 0) {
                endGame();
            }
        }
    });
}


// HUD
function updateHUD() {

    scoreText.textContent = score;
    healthText.textContent = Math.max(0, health);
    targetsText.textContent = drones.length;
}


// GAME OVER
function endGame() {

    gameStarted = false;

    finalScore.textContent = score;

    gameOver.style.display = "block";

    camera.detachControl();
}


// START GAME
startButton.addEventListener("click", () => {

    gameStarted = true;

    instructions.style.display = "none";

    canvas.requestPointerLock();

    for (let i = 0; i < 6; i++) {
        createDrone();
    }
});


// MOUSE SHOOT
canvas.addEventListener("click", () => {

    if (gameStarted) {
        shoot();
    }

});


// CREATE SCENE
createScene();


// GAME LOOP
engine.runRenderLoop(() => {

    if (scene) {

        updateDrones();

        scene.render();
    }

});


// RESIZE
window.addEventListener("resize", () => {

    engine.resize();

});
