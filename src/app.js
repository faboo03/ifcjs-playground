import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { IFCLoader } from "web-ifc-three/IFCLoader";
import {geometryTypes} from "./geometry-types";
import {IfcAPI} from "web-ifc/web-ifc-api";

//Creates the Three.js scene
const scene = new Scene();

//Object to store the size of the viewport
const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};

//Creates the camera (point of view of the user)
const camera = new PerspectiveCamera(75, size.width / size.height);
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

//Creates the lights of the scene
const lightColor = 0xffffff;

const ambientLight = new AmbientLight(lightColor, 0.5);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(lightColor, 1);
directionalLight.position.set(0, 10, 0);
directionalLight.target.position.set(-5, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

//Sets up the renderer, fetching the canvas of the HTML
const threeCanvas = document.getElementById("three-canvas");
const renderer = new WebGLRenderer({ canvas: threeCanvas, alpha: true });
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Creates grids and axes in the scene
const grid = new GridHelper(50, 30);
scene.add(grid);

const axes = new AxesHelper();
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

//Creates the orbit controls (to navigate the scene)
const controls = new OrbitControls(camera, threeCanvas);
controls.enableDamping = true;
controls.target.set(-2, 0, 0);

//Animation loop
const animate = () => {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();

//Adjust the viewport to the size of the browser
window.addEventListener("resize", () => {
  (size.width = window.innerWidth), (size.height = window.innerHeight);
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
});







//Sets up the IFC loading
const ifcLoader = new IFCLoader();
ifcLoader.ifcManager.setWasmPath("../wasm/");
const ifcapi = new IfcAPI();
ifcapi.SetWasmPath("../wasm/");

  const input = document.getElementById("file-input");
  const hero =  document.getElementById("hero");


  /* 
  input.addEventListener(
    "change",
    (changed) => {
      const ifcURL = URL.createObjectURL(changed.target.files[0]);
      console.log(ifcURL);
      ifcLoader.load(ifcURL, (ifcModel) => {
          scene.add(ifcModel);          
          hero.remove();
        });
    },
    false
  );
  */

input.addEventListener(
    "change",
    (changed) => {
        const reader = new FileReader();
        reader.onload = () => LoadFile(reader.result);
        reader.readAsText(changed.target.files[0]);
    },
    false
);

async function LoadFile(ifcAsText) {
    ifcAsText.replace(/(?:\r\n|\r|\n)/g, '<br>');
    const modelID = await OpenIfc(ifcAsText);
    const allItems = GetAllItems(modelID);
    const result = JSON.stringify(allItems, undefined, 2);

    console.log(result);

    ifcapi.CloseModel(modelID);
}

async function OpenIfc(ifcAsText) {
    await ifcapi.Init();
    return ifcapi.OpenModel(ifcAsText);
}

function GetAllItems(modelID, excludeGeometry = true) {
    const allItems = {};
    const lines = ifcapi.GetAllLines(modelID);
    getAllItemsFromLines(modelID, lines, allItems, excludeGeometry);
    return allItems;
}

function getAllItemsFromLines(modelID, lines, allItems, excludeGeometry) {
    for (let i = 1; i <= lines.size(); i++) {
        try {
            saveProperties(modelID, lines, allItems, excludeGeometry, i);
        } catch (e) {
            console.log(e);
        }
    }
}

function saveProperties(modelID, lines, allItems, excludeGeometry, index) {
    const itemID = lines.get(index);
    const props = ifcapi.GetLine(modelID, itemID);
    props.type = props.__proto__.constructor.name;
    if (!excludeGeometry || !geometryTypes.has(props.type)) {
        allItems[itemID] = props;
    }
}