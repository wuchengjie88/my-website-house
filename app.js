import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";

const canvas = document.querySelector("#modelCanvas");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdde2e0);
scene.fog = new THREE.Fog(0xdde2e0, 36, 80);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
camera.position.set(7.4, 12.2, -24);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.9, 6.8, -3.7);
controls.enableDamping = true;
controls.minDistance = 15;
controls.maxDistance = 52;
controls.maxPolarAngle = Math.PI * 0.49;

const materials = {
  wall: new THREE.MeshStandardMaterial({ color: 0xeee8d8, roughness: 0.78 }),
  trim: new THREE.MeshStandardMaterial({ color: 0x181614, roughness: 0.58 }),
  darkPanel: new THREE.MeshStandardMaterial({ color: 0x4a4236, roughness: 0.74 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x9a8e78, roughness: 0.92 }),
  stoneJoint: new THREE.MeshBasicMaterial({ color: 0x5e5548, transparent: true, opacity: 0.44 }),
  terraceShade: new THREE.MeshStandardMaterial({
    color: 0x15120f,
    roughness: 0.9,
    transparent: true,
    opacity: 0.28,
  }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xaed6df,
    roughness: 0.08,
    metalness: 0.02,
    transmission: 0.18,
    transparent: true,
    opacity: 0.68,
  }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x655f55, roughness: 0.84 }),
  step: new THREE.MeshStandardMaterial({ color: 0xd8cbbb, roughness: 0.85 }),
  ground: new THREE.MeshStandardMaterial({ color: 0x93ad76, roughness: 0.9 }),
};

const model = new THREE.Group();
const balconies = new THREE.Group();
const columns = new THREE.Group();
const roofs = new THREE.Group();
scene.add(model, balconies, columns, roofs);
columns.visible = false;

function box(name, size, position, material, parent = model, castShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
  mesh.name = name;
  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function edged(mesh, color = 0x1b1917, opacity = 0.35) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 18),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
  edges.position.copy(mesh.position);
  edges.rotation.copy(mesh.rotation);
  edges.scale.copy(mesh.scale);
  mesh.parent.add(edges);
  return edges;
}

function trimBox(size, position, parent = model) {
  const m = box("dark trim", size, position, materials.trim, parent);
  edged(m, 0x050505, 0.45);
  return m;
}

function addParapet(width, depth, y, z, parent = roofs, frontGap = null, rightFrontGap = null) {
  const h = 0.36;
  if (frontGap) {
    const frontMin = -width / 2 - 0.35;
    const frontMax = width / 2 + 0.35;
    const gapMin = frontGap.x - frontGap.width / 2;
    const gapMax = frontGap.x + frontGap.width / 2;
    const leftW = Math.max(0, gapMin - frontMin);
    const rightW = Math.max(0, frontMax - gapMax);
    if (leftW > 0.05) {
      trimBox({ x: leftW, y: h, z: 0.34 }, { x: frontMin + leftW / 2, y, z: z - depth / 2 - 0.18 }, parent);
      trimBox({ x: leftW, y: 0.12, z: 0.22 }, { x: frontMin + leftW / 2, y: y + 0.27, z: z - depth / 2 - 0.28 }, parent);
    }
    if (rightW > 0.05) {
      trimBox({ x: rightW, y: h, z: 0.34 }, { x: gapMax + rightW / 2, y, z: z - depth / 2 - 0.18 }, parent);
      trimBox({ x: rightW, y: 0.12, z: 0.22 }, { x: gapMax + rightW / 2, y: y + 0.27, z: z - depth / 2 - 0.28 }, parent);
    }
  } else {
    trimBox({ x: width + 0.7, y: h, z: 0.34 }, { x: 0, y, z: z - depth / 2 - 0.18 }, parent);
    trimBox({ x: width + 0.78, y: 0.12, z: 0.22 }, { x: 0, y: y + 0.27, z: z - depth / 2 - 0.28 }, parent);
  }
  trimBox({ x: width + 0.7, y: h, z: 0.34 }, { x: 0, y, z: z + depth / 2 + 0.18 }, parent);
  trimBox({ x: 0.34, y: h, z: depth + 0.7 }, { x: -width / 2 - 0.18, y, z }, parent);
  if (rightFrontGap) {
    const sideMin = z - depth / 2 - 0.35;
    const sideMax = z + depth / 2 + 0.35;
    const gapMin = rightFrontGap.z - rightFrontGap.depth / 2;
    const gapMax = rightFrontGap.z + rightFrontGap.depth / 2;
    const frontPart = Math.max(0, gapMin - sideMin);
    const rearPart = Math.max(0, sideMax - gapMax);
    if (frontPart > 0.05) {
      trimBox({ x: 0.34, y: h, z: frontPart }, { x: width / 2 + 0.18, y, z: sideMin + frontPart / 2 }, parent);
      trimBox({ x: 0.22, y: 0.12, z: frontPart }, { x: width / 2 + 0.28, y: y + 0.27, z: sideMin + frontPart / 2 }, parent);
    }
    if (rearPart > 0.05) {
      trimBox({ x: 0.34, y: h, z: rearPart }, { x: width / 2 + 0.18, y, z: gapMax + rearPart / 2 }, parent);
      trimBox({ x: 0.22, y: 0.12, z: rearPart }, { x: width / 2 + 0.28, y: y + 0.27, z: gapMax + rearPart / 2 }, parent);
    }
  } else {
    trimBox({ x: 0.34, y: h, z: depth + 0.7 }, { x: width / 2 + 0.18, y, z }, parent);
    trimBox({ x: 0.22, y: 0.12, z: depth + 0.78 }, { x: width / 2 + 0.28, y: y + 0.27, z }, parent);
  }
  trimBox({ x: width + 0.78, y: 0.12, z: 0.22 }, { x: 0, y: y + 0.27, z: z + depth / 2 + 0.28 }, parent);
  trimBox({ x: 0.22, y: 0.12, z: depth + 0.78 }, { x: -width / 2 - 0.28, y: y + 0.27, z }, parent);
}

function addWindow(x, y, z, w, h, face = "front", parent = model) {
  const frameDepth = 0.035;
  const glassDepth = 0.024;
  const frame = materials.trim;
  const glass = materials.glass;
  const isFront = face === "front" || face === "back";
  const sign = face === "back" ? 1 : -1;
  const xSign = face === "right" ? 1 : -1;

  if (isFront) {
    box("window glass", { x: w, y: h, z: glassDepth }, { x, y, z }, glass, parent);
    box("window top", { x: w + 0.22, y: 0.09, z: frameDepth }, { x, y: y + h / 2 + 0.06, z }, frame, parent);
    box("window bottom", { x: w + 0.22, y: 0.09, z: frameDepth }, { x, y: y - h / 2 - 0.06, z }, frame, parent);
    box("window left", { x: 0.09, y: h + 0.14, z: frameDepth }, { x: x - w / 2 - 0.06, y, z }, frame, parent);
    box("window right", { x: 0.09, y: h + 0.14, z: frameDepth }, { x: x + w / 2 + 0.06, y, z }, frame, parent);
    box("window mullion", { x: 0.055, y: h, z: frameDepth }, { x: x + w * 0.22, y, z }, frame, parent);
  } else {
    box("window glass", { x: glassDepth, y: h, z: w }, { x, y, z }, glass, parent);
    box("window top", { x: frameDepth, y: 0.09, z: w + 0.22 }, { x, y: y + h / 2 + 0.06, z }, frame, parent);
    box("window bottom", { x: frameDepth, y: 0.09, z: w + 0.22 }, { x, y: y - h / 2 - 0.06, z }, frame, parent);
    box("window side", { x: frameDepth, y: h + 0.14, z: 0.09 }, { x, y, z: z - w / 2 - 0.06 }, frame, parent);
    box("window side", { x: frameDepth, y: h + 0.14, z: 0.09 }, { x, y, z: z + w / 2 + 0.06 }, frame, parent);
    box("window mullion", { x: frameDepth, y: h, z: 0.055 }, { x, y, z: z + w * 0.22 }, frame, parent);
  }
}

function addSlimWindowPair(x, y, z, face = "front", parent = model) {
  if (face === "front" || face === "back") {
    addWindow(x - 0.28, y, z, 0.32, 1.42, face, parent);
    addWindow(x + 0.28, y, z, 0.32, 1.42, face, parent);
  } else {
    addWindow(x, y, z - 0.28, 0.32, 1.42, face, parent);
    addWindow(x, y, z + 0.28, 0.32, 1.42, face, parent);
  }
}

function addFrontPanel(x, width, y, height, z, material = materials.darkPanel, depth = 0.018) {
  return box("projecting front facade panel", { x: width, y: height, z: depth }, { x, y, z }, material);
}

function addSidePanel(x, z, width, y, height, face = "right", material = materials.darkPanel, depth = 0.018) {
  const outwardX = face === "right" ? x : -x;
  return box("projecting side facade panel", { x: depth, y: height, z: width }, { x: outwardX, y, z }, material);
}

function addStoneFrontPanel(x, width, y, height, z, parent = model) {
  box("flat cultural stone front panel", { x: width, y: height, z: 0.018 }, { x, y, z }, materials.stone, parent);
  const yMin = y - height / 2 + 0.28;
  const yMax = y + height / 2 - 0.18;
  for (let rowY = yMin; rowY <= yMax; rowY += 0.34) {
    box("stone horizontal joint", { x: width - 0.08, y: 0.018, z: 0.006 }, { x, y: rowY, z: z - 0.012 }, materials.stoneJoint, parent, false);
  }
  let offset = 0;
  for (let rowY = yMin + 0.17; rowY <= yMax; rowY += 0.68) {
    const count = Math.max(2, Math.floor(width / 0.48));
    for (let i = 1; i < count; i += 1) {
      const px = x - width / 2 + i * (width / count) + (offset ? 0.08 : -0.04);
      box("stone vertical joint", { x: 0.014, y: 0.3, z: 0.006 }, { x: px, y: rowY, z: z - 0.014 }, materials.stoneJoint, parent, false);
    }
    offset = 1 - offset;
  }
}

function addStoneSidePanel(x, z, width, y, height, face = "right", parent = model) {
  const outwardX = face === "right" ? x : -x;
  box("flat cultural stone side panel", { x: 0.018, y: height, z: width }, { x: outwardX, y, z }, materials.stone, parent);
  const yMin = y - height / 2 + 0.28;
  const yMax = y + height / 2 - 0.18;
  for (let rowY = yMin; rowY <= yMax; rowY += 0.34) {
    box("stone side horizontal joint", { x: 0.006, y: 0.018, z: width - 0.08 }, { x: outwardX + (face === "right" ? 0.012 : -0.012), y: rowY, z }, materials.stoneJoint, parent, false);
  }
  let offset = 0;
  for (let rowY = yMin + 0.17; rowY <= yMax; rowY += 0.68) {
    const count = Math.max(2, Math.floor(width / 0.48));
    for (let i = 1; i < count; i += 1) {
      const pz = z - width / 2 + i * (width / count) + (offset ? 0.08 : -0.04);
      box("stone side vertical joint", { x: 0.006, y: 0.3, z: 0.014 }, { x: outwardX + (face === "right" ? 0.014 : -0.014), y: rowY, z: pz }, materials.stoneJoint, parent, false);
    }
    offset = 1 - offset;
  }
}

function addFrontPilaster(x, z, y = 6.35, height = 12.7, width = 0.32, depth = 0.2) {
  const p = box("projecting cream front pilaster", { x: width, y: height, z: depth }, { x, y, z }, materials.wall, columns);
  edged(p, 0x1b1917, 0.28);
  return p;
}

function addSidePilaster(x, z, face = "right", y = 6.35, height = 12.7, width = 0.32, depth = 0.2) {
  const outwardX = face === "right" ? x : -x;
  const p = box("projecting cream side pilaster", { x: depth, y: height, z: width }, { x: outwardX, y, z }, materials.wall, columns);
  edged(p, 0x1b1917, 0.28);
  return p;
}

function addVerticalBay(x, z, levels, face = "front", width = 0.9) {
  for (const y of levels) addWindow(x, y, z, width, 1.55, face);
  const panelHeight = levels.length * 3.05 + 0.2;
  const panelY = (levels[0] + levels[levels.length - 1]) / 2;
  if (face === "front" || face === "back") {
    box("dark vertical window band", { x: width + 0.46, y: panelHeight, z: 0.1 }, { x, y: panelY, z: z + (face === "back" ? 0.055 : -0.055) }, materials.darkPanel);
  } else {
    box("dark vertical window band", { x: 0.1, y: panelHeight, z: width + 0.46 }, { x: x + (face === "right" ? 0.055 : -0.055), y: panelY, z }, materials.darkPanel);
  }
  for (const y of levels) addWindow(x, y, z, width, 1.55, face);
}

function addBalcony(x, y, z, w, d) {
  box("balcony slab", { x: w, y: 0.18, z: d }, { x, y, z }, materials.step, balconies);
  box("balcony glass front", { x: w, y: 0.72, z: 0.06 }, { x, y: y + 0.42, z: z - d / 2 }, materials.glass, balconies);
  box("balcony rail", { x: w + 0.1, y: 0.08, z: 0.1 }, { x, y: y + 0.82, z: z - d / 2 - 0.03 }, materials.trim, balconies);
  box("balcony side rail", { x: 0.06, y: 0.72, z: d }, { x: x - w / 2, y: y + 0.42, z }, materials.glass, balconies);
  box("balcony side rail", { x: 0.06, y: 0.72, z: d }, { x: x + w / 2, y: y + 0.42, z }, materials.glass, balconies);
}

function addTerrace(x, y, z, w, d, openSide = "front", parent = balconies) {
  box("open terrace deck", { x: w, y: 0.12, z: d }, { x, y, z }, materials.step, parent, false);
  const railY = y + 0.48;
  const railH = 0.7;
  const railT = 0.07;
  const capH = 0.08;
  if (openSide !== "front") {
    box("terrace glass rail back/front", { x: w, y: railH, z: railT }, { x, y: railY, z: z - d / 2 }, materials.glass, parent, false);
    trimBox({ x: w + 0.08, y: capH, z: 0.1 }, { x, y: railY + railH / 2 + 0.06, z: z - d / 2 - 0.02 }, parent);
  }
  if (openSide !== "back") {
    box("terrace glass rail back/front", { x: w, y: railH, z: railT }, { x, y: railY, z: z + d / 2 }, materials.glass, parent, false);
    trimBox({ x: w + 0.08, y: capH, z: 0.1 }, { x, y: railY + railH / 2 + 0.06, z: z + d / 2 + 0.02 }, parent);
  }
  if (openSide !== "left") {
    box("terrace glass rail side", { x: railT, y: railH, z: d }, { x: x - w / 2, y: railY, z }, materials.glass, parent, false);
    trimBox({ x: 0.1, y: capH, z: d + 0.08 }, { x: x - w / 2 - 0.02, y: railY + railH / 2 + 0.06, z }, parent);
  }
  if (openSide !== "right") {
    box("terrace glass rail side", { x: railT, y: railH, z: d }, { x: x + w / 2, y: railY, z }, materials.glass, parent, false);
    trimBox({ x: 0.1, y: capH, z: d + 0.08 }, { x: x + w / 2 + 0.02, y: railY + railH / 2 + 0.06, z }, parent);
  }
}

function addRecessedTerrace(x, floorY, zFront, w, d, h, parent = balconies) {
  const centerY = floorY + h / 2;
  const backZ = zFront + d;
  const sideT = 0.22;
  const slabT = 0.18;
  const railH = 0.82;

  box("visible dark recessed opening", { x: w - 0.28, y: h - 0.3, z: 0.16 }, { x, y: centerY + 0.04, z: zFront - 0.08 }, materials.darkPanel, parent);
  box("cream terrace front left jamb", { x: 0.28, y: h + 0.22, z: 0.28 }, { x: x - w / 2 + 0.14, y: centerY, z: zFront - 0.14 }, materials.wall, parent);
  box("cream terrace front right jamb", { x: 0.28, y: h + 0.22, z: 0.28 }, { x: x + w / 2 - 0.14, y: centerY, z: zFront - 0.14 }, materials.wall, parent);
  trimBox({ x: w + 0.08, y: 0.18, z: 0.32 }, { x, y: floorY + h + 0.06, z: zFront - 0.16 }, parent);
  trimBox({ x: w + 0.08, y: 0.18, z: 0.32 }, { x, y: floorY - 0.02, z: zFront - 0.16 }, parent);
  box("recessed terrace back wall", { x: w, y: h, z: 0.12 }, { x, y: centerY, z: backZ }, materials.wall, parent);
  box("recessed terrace shadow", { x: w - sideT * 2, y: h - 0.18, z: 0.08 }, { x, y: centerY, z: backZ - 0.08 }, materials.darkPanel, parent);
  box("recessed terrace left return", { x: sideT, y: h, z: d }, { x: x - w / 2 + sideT / 2, y: centerY, z: zFront + d / 2 }, materials.wall, parent);
  box("recessed terrace right return", { x: sideT, y: h, z: d }, { x: x + w / 2 - sideT / 2, y: centerY, z: zFront + d / 2 }, materials.wall, parent);
  trimBox({ x: w + 0.24, y: slabT, z: d + 0.22 }, { x, y: floorY, z: zFront + d / 2 }, parent);
  trimBox({ x: w + 0.24, y: slabT, z: d + 0.22 }, { x, y: floorY + h, z: zFront + d / 2 }, parent);
  trimBox({ x: w + 0.34, y: 0.12, z: 0.16 }, { x, y: floorY + h + 0.18, z: zFront - 0.04 }, parent);

  box("recessed terrace glass rail", { x: w - 0.56, y: railH, z: 0.08 }, { x, y: floorY + 0.58, z: zFront - 0.28 }, materials.glass, parent, false);
  trimBox({ x: w - 0.38, y: 0.08, z: 0.12 }, { x, y: floorY + railH + 0.18, z: zFront - 0.32 }, parent);
  box("terrace rear door glass", { x: 0.78, y: 1.75, z: 0.08 }, { x: x - 0.35, y: floorY + 1.35, z: zFront - 0.36 }, materials.glass, parent);
  box("terrace rear window glass", { x: 0.62, y: 1.25, z: 0.08 }, { x: x + 0.55, y: floorY + 1.45, z: zFront - 0.37 }, materials.glass, parent);
}

function addReferenceLoggia(x, floorY, zFront, w = 2.65, h = 2.42, parent = balconies) {
  const cy = floorY + h / 2;
  const openingZ = zFront - 0.08;
  const depth = 1.05;
  const backZ = zFront + depth;
  box("large shadowed terrace opening", { x: w + 0.14, y: h + 0.12, z: 0.08 }, { x, y: cy, z: openingZ }, materials.terraceShade, parent, false);
  box("terrace inner back wall", { x: w - 0.72, y: h - 0.44, z: 0.1 }, { x, y: cy + 0.05, z: backZ }, materials.wall, parent);
  box("terrace back shadow band", { x: w - 0.62, y: 0.34, z: 0.12 }, { x, y: floorY + 0.34, z: backZ - 0.04 }, materials.darkPanel, parent);
  box("terrace usable floor", { x: w - 0.34, y: 0.12, z: depth }, { x, y: floorY + 0.06, z: zFront + depth / 2 }, materials.step, parent, false);
  box("terrace left return wall", { x: 0.42, y: h + 0.36, z: depth + 0.1 }, { x: x - w / 2 - 0.03, y: cy, z: zFront + depth / 2 }, materials.wall, parent);
  box("terrace right return wall", { x: 0.42, y: h + 0.36, z: depth + 0.1 }, { x: x + w / 2 + 0.03, y: cy, z: zFront + depth / 2 }, materials.wall, parent);
  box("terrace ceiling plane", { x: w + 0.86, y: 0.24, z: depth + 0.18 }, { x, y: floorY + h + 0.12, z: zFront + depth / 2 }, materials.wall, parent);
  box("terrace bottom slab", { x: w + 0.86, y: 0.24, z: depth + 0.18 }, { x, y: floorY - 0.08, z: zFront + depth / 2 }, materials.wall, parent);
  trimBox({ x: w + 1.0, y: 0.18, z: 0.24 }, { x, y: floorY + h + 0.31, z: zFront - 0.2 }, parent);
  trimBox({ x: w + 1.0, y: 0.18, z: 0.24 }, { x, y: floorY - 0.25, z: zFront - 0.2 }, parent);

  box("terrace glass guard", { x: w - 0.46, y: 0.92, z: 0.08 }, { x, y: floorY + 0.66, z: zFront - 0.22 }, materials.glass, parent, false);
  trimBox({ x: w - 0.18, y: 0.08, z: 0.14 }, { x, y: floorY + 1.15, z: zFront - 0.25 }, parent);
  for (const offset of [-0.48, 0, 0.48]) {
    trimBox({ x: 0.045, y: 0.88, z: 0.1 }, { x: x + offset, y: floorY + 0.66, z: zFront - 0.26 }, parent);
  }
  box("small rear terrace door glass", { x: 0.58, y: 1.34, z: 0.08 }, { x: x - 0.38, y: floorY + 1.34, z: backZ - 0.08 }, materials.glass, parent);
  box("small rear terrace window glass", { x: 0.46, y: 0.95, z: 0.08 }, { x: x + 0.42, y: floorY + 1.46, z: backZ - 0.08 }, materials.glass, parent);
  trimBox({ x: 0.08, y: 1.38, z: 0.1 }, { x: x + 0.02, y: floorY + 1.34, z: backZ - 0.12 }, parent);
}

function addReferenceLoggiaStack() {
  addReferenceLoggia(1.6, 3.2, -6.62, 2.95, 2.45);
  addReferenceLoggia(1.6, 6.35, -6.62, 2.95, 2.45);
  addReferenceLoggia(1.6, 9.5, -6.62, 2.95, 2.45);
  addFrontPilaster(-0.02, -7.18, 6.45, 9.9, 0.46, 0.58);
  addFrontPilaster(3.22, -7.18, 6.45, 9.9, 0.46, 0.58);
}

function addMiddleRoofTerrace() {
  const x = 1.6;
  const y = 9.5;
  const z = -3.525;
  const w = 3.6;
  const d = 3.35;
  const railH = 0.82;
  const frontEdge = z - d / 2 + 0.16;
  const rightEdge = x + w / 2 - 0.16;

  box("fourth floor carved terrace floor", { x: w - 0.5, y: 0.08, z: d - 0.48 }, { x, y: y + 0.05, z: z + 0.04 }, materials.step, balconies, false);
  box("fourth floor recessed waterproof floor", { x: w - 0.8, y: 0.035, z: d - 0.8 }, { x, y: y + 0.12, z: z + 0.08 }, materials.glass, balconies, false);

  box("fourth floor cutout glass guard front", { x: w - 0.52, y: railH, z: 0.06 }, { x, y: y + railH / 2, z: frontEdge }, materials.glass, balconies, false);
  box("fourth floor cutout glass guard open side", { x: 0.06, y: railH, z: d - 0.44 }, { x: rightEdge, y: y + railH / 2, z: z + 0.04 }, materials.glass, balconies, false);

  trimBox({ x: w - 0.3, y: 0.1, z: 0.12 }, { x, y: y + railH + 0.06, z: frontEdge - 0.04 }, balconies);
  trimBox({ x: 0.12, y: 0.1, z: d - 0.32 }, { x: rightEdge + 0.02, y: y + railH + 0.06, z: z + 0.04 }, balconies);

  trimBox({ x: w - 0.18, y: 0.16, z: 0.2 }, { x, y: y - 0.08, z: frontEdge - 0.08 }, balconies);
}

function addTerraceInnerParapet() {
  const x = 1.6;
  const y = 12.85;
  const z = -3.525;
  const w = 3.6;
  const d = 3.35;
  const h = 0.34;
  const backEdge = z + d / 2 - 0.12;
  const leftEdge = x - w / 2 + 0.12;
  const innerReturnDepth = 1.05;
  const innerReturnZ = backEdge - innerReturnDepth / 2 + 0.02;

  box("terrace inner parapet back", { x: w - 0.38, y: h, z: 0.24 }, { x, y, z: backEdge }, materials.wall, roofs);
  trimBox({ x: w - 0.2, y: 0.1, z: 0.12 }, { x, y: y + 0.23, z: backEdge + 0.04 }, roofs);
  box("terrace inner parapet return at notch", { x: 0.24, y: h, z: innerReturnDepth }, { x: leftEdge, y, z: innerReturnZ }, materials.wall, roofs);
  trimBox({ x: 0.12, y: 0.1, z: innerReturnDepth + 0.12 }, { x: leftEdge - 0.04, y: y + 0.23, z: innerReturnZ }, roofs);
}

function addFourthFloorCarvedMass() {
  const cy = 11.025;
  const h = 3.15;
  box("fourth floor rear mass after terrace cut", { x: 7.5, y: h, z: 7.05 }, { x: 0, y: cy, z: 1.675 }, materials.wall);
  box("fourth floor west room mass beside terrace", { x: 3.3, y: h, z: 3.35 }, { x: -2.1, y: cy, z: -3.525 }, materials.wall);
  box("fourth floor room wall beside carved terrace", { x: 0.28, y: h, z: 3.35 }, { x: -0.15, y: cy, z: -3.525 }, materials.wall);
}

function addRoofDeck() {
  box("rear flat roof surface", { x: 7.0, y: 0.08, z: 7.05 }, { x: 0, y: 12.66, z: 1.675 }, materials.step, roofs, false);
  box("west front roof surface beside terrace", { x: 3.3, y: 0.08, z: 3.35 }, { x: -2.1, y: 12.66, z: -3.525 }, materials.step, roofs, false);
  box("roof access door glass", { x: 0.08, y: 1.35, z: 0.78 }, { x: 0.98, y: 13.45, z: 1.0 }, materials.glass, roofs);
  box("roof door frame", { x: 0.12, y: 1.55, z: 0.95 }, { x: 0.94, y: 13.45, z: 1.0 }, materials.trim, roofs);
}

function buildHouse() {
  const main = box("main lower three-storey block", { x: 7.5, y: 9.45, z: 10.4 }, { x: 0, y: 4.725, z: 0 }, materials.wall);
  // Keep the large wall planes clean and modern; avoid sketch-like outline strokes.
  addFourthFloorCarvedMass();

  const rearRise = box("rear stair tower mass", { x: 3.95, y: 12.6, z: 3.25 }, { x: -1.775, y: 6.3, z: 2.95 }, materials.wall);

  const roofTower = box("roof access tower", { x: 3.0, y: 2.2, z: 3.0 }, { x: -0.55, y: 13.7, z: 1.0 }, materials.wall);

  box("dark base plinth", { x: 8.1, y: 0.55, z: 11.0 }, { x: 0, y: 0.275, z: 0 }, materials.stone);
  box("recessed entry threshold", { x: 2.05, y: 0.1, z: 0.34 }, { x: 1.6, y: 0.08, z: -5.222 }, materials.step);

  const cornerXs = [-3.98, 3.98];
  const cornerZs = [-5.38, 5.38];
  for (const x of cornerXs) {
    for (const z of cornerZs) {
      box("cream corner pilaster", { x: 0.36, y: 12.75, z: 0.36 }, { x, y: 6.375, z }, materials.wall, columns);
      box("dark pilaster foot", { x: 0.72, y: 0.32, z: 0.72 }, { x, y: 0.78, z }, materials.concrete, columns);
    }
  }
  addParapet(7.5, 10.4, 12.85, 0, roofs, { x: 1.6, width: 3.6 }, { z: -3.525, depth: 3.35 });
  addParapet(3.0, 3.0, 14.95, 1.0);
  addRoofDeck();
  addTerraceInnerParapet();

  trimBox({ x: 3.3, y: 0.16, z: 0.22 }, { x: -2.1, y: 10.35, z: -5.15 }, roofs);
  trimBox({ x: 8.1, y: 0.16, z: 0.22 }, { x: 0, y: 10.35, z: 5.15 }, roofs);
  trimBox({ x: 0.22, y: 0.16, z: 10.75 }, { x: -3.9, y: 10.35, z: 0 }, roofs);
  trimBox({ x: 0.22, y: 0.16, z: 10.75 }, { x: 3.9, y: 10.35, z: 0 }, roofs);

  addFrontPanel(-2.45, 0.95, 6.55, 11.5, -5.214, materials.darkPanel, 0.012);
  addStoneFrontPanel(0.58, 0.34, 2.05, 3.45, -5.224);
  addStoneFrontPanel(2.62, 0.34, 2.05, 3.45, -5.224);
  addStoneFrontPanel(2.85, 0.82, 6.45, 4.85, -5.224);
  addFrontPilaster(-3.05, -5.48);
  addFrontPilaster(-1.82, -5.48);
  addFrontPilaster(2.03, -5.48);
  addFrontPilaster(3.48, -5.48);

  addStoneSidePanel(3.764, 2.55, 1.2, 3.15, 4.9, "right");
  addSidePanel(3.764, 2.55, 1.12, 8.05, 2.45, "right", materials.darkPanel, 0.012);
  addSidePanel(3.764, -2.65, 1.05, 5.0, 8.6, "right", materials.darkPanel, 0.012);
  addSidePilaster(4.08, -3.35, "right");
  addSidePilaster(4.08, -1.82, "right");
  addSidePilaster(4.08, 1.82, "right");
  addSidePilaster(4.08, 3.35, "right");

  addSidePanel(3.764, -0.45, 0.9, 6.55, 11.5, "left", materials.darkPanel, 0.012);
  addSidePanel(3.764, 0.65, 0.9, 6.55, 11.5, "left", materials.darkPanel, 0.012);
  addSidePilaster(4.08, -3.2, "left");
  addSidePilaster(4.08, -1.65, "left");
  addSidePilaster(4.08, 0.55, "left");
  addSidePilaster(4.08, 1.9, "left");
  addSidePilaster(4.08, 3.48, "left");

  addFrontPanel(-2.15, 0.92, 6.55, 11.2, 5.214, materials.darkPanel, 0.012);
  addFrontPanel(-0.2, 0.92, 6.55, 11.2, 5.214, materials.darkPanel, 0.012);
  addStoneFrontPanel(2.55, 1.12, 3.2, 5.0, 5.224);
  addFrontPanel(2.55, 1.06, 8.4, 5.2, 5.214, materials.darkPanel, 0.012);

  addWindow(-1.95, 1.65, -5.225, 1.05, 1.55, "front");
  addWindow(-1.95, 4.9, -5.225, 1.05, 1.55, "front");
  addWindow(-1.95, 8.05, -5.225, 1.05, 1.55, "front");

  addWindow(1.6, 4.9, -5.225, 1.42, 1.72, "front");
  addWindow(1.6, 8.05, -5.225, 1.42, 1.72, "front");
  addWindow(-2.75, 11.2, -5.225, 0.82, 1.62, "front");
  addWindow(0.005, 11.2, -3.525, 0.82, 1.62, "right");

  for (const y of [1.65, 4.9, 8.05, 11.2]) {
    addSlimWindowPair(3.775, y, 2.55, "right");
    if (y < 10) addWindow(3.775, y, -2.65, 0.82, 1.55, "right");
    addWindow(-3.775, y, -0.45, 0.52, 1.48, "left");
    addWindow(-3.775, y, 0.65, 0.52, 1.48, "left");
  }

  addWindow(-2.15, 1.65, 5.225, 0.64, 1.55, "back");
  addWindow(-0.2, 1.65, 5.225, 0.64, 1.55, "back");
  addWindow(2.55, 1.65, 5.225, 0.8, 1.55, "back");
  addWindow(-2.15, 4.9, 5.225, 0.64, 1.55, "back");
  addWindow(-0.2, 4.9, 5.225, 0.64, 1.55, "back");
  addWindow(2.55, 4.9, 5.225, 0.8, 1.55, "back");
  addWindow(-2.15, 8.05, 5.225, 0.64, 1.55, "back");
  addWindow(-0.2, 8.05, 5.225, 0.64, 1.55, "back");
  addWindow(2.55, 8.05, 5.225, 0.8, 1.55, "back");
  addWindow(2.55, 11.2, 5.225, 0.8, 1.55, "back");
  addWindow(-0.55, 13.7, -0.55, 0.9, 1.25, "front");

  box("recessed entry shadow", { x: 2.0, y: 2.45, z: 0.08 }, { x: 1.6, y: 1.52, z: -5.22 }, materials.terraceShade, model, false);
  box("front double glass door", { x: 1.42, y: 2.12, z: 0.08 }, { x: 1.6, y: 1.36, z: -5.218 }, materials.glass);
  box("door center mullion", { x: 0.08, y: 2.24, z: 0.1 }, { x: 1.6, y: 1.36, z: -5.22 }, materials.trim);
  trimBox({ x: 1.62, y: 0.1, z: 0.1 }, { x: 1.6, y: 2.5, z: -5.23 });
  trimBox({ x: 0.1, y: 2.34, z: 0.1 }, { x: 0.82, y: 1.36, z: -5.23 });
  trimBox({ x: 0.1, y: 2.34, z: 0.1 }, { x: 2.38, y: 1.36, z: -5.23 });

  addMiddleRoofTerrace();
}

function addLandscape() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), materials.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const path = box("front path", { x: 3.8, y: 0.04, z: 14 }, { x: 0.4, y: 0.025, z: -12 }, materials.step, scene, false);
  path.receiveShadow = true;

  for (let i = 0; i < 6; i += 1) {
    const trunk = box("simple tree trunk", { x: 0.22, y: 2.2, z: 0.22 }, { x: 9 + i * 1.2, y: 1.1, z: 3 + Math.sin(i) }, materials.concrete, scene);
    const crown = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.0 + (i % 2) * 0.22, 0),
      new THREE.MeshStandardMaterial({ color: i % 2 ? 0x9a7d48 : 0x7f914b, roughness: 0.9 })
    );
    crown.position.set(trunk.position.x, 2.9, trunk.position.z);
    crown.castShadow = true;
    scene.add(crown);
  }
}

buildHouse();
addLandscape();

const hemi = new THREE.HemisphereLight(0xffffff, 0xa0a087, 1.7);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(8, 18, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 55;
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 22;
sun.shadow.camera.bottom = -16;
scene.add(sun);

let spinning = true;

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== Math.floor(width * renderer.getPixelRatio()) || canvas.height !== Math.floor(height * renderer.getPixelRatio())) {
    renderer.setSize(width, height, false);
    camera.fov = width < 720 ? 56 : 42;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function animate() {
  requestAnimationFrame(animate);
  resize();
  if (spinning) model.rotation.y += 0.0022;
  balconies.rotation.y = model.rotation.y;
  columns.rotation.y = model.rotation.y;
  roofs.rotation.y = model.rotation.y;
  controls.update();
  renderer.render(scene, camera);
}

document.querySelector("#resetView").addEventListener("click", () => {
  camera.position.set(7.4, 12.2, -24);
  controls.target.set(0.9, 6.8, -3.7);
  model.rotation.y = 0;
  controls.update();
});

document.querySelector("#spinToggle").addEventListener("click", () => {
  spinning = !spinning;
});

document.querySelector("#toggleBalcony").addEventListener("change", (event) => {
  balconies.visible = event.target.checked;
});

document.querySelector("#toggleColumns").addEventListener("change", (event) => {
  columns.visible = event.target.checked;
});

document.querySelector("#toggleRoof").addEventListener("change", (event) => {
  roofs.visible = event.target.checked;
});

document.querySelectorAll(".swatch").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".swatch").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    materials.wall.color.set(button.dataset.wall);
  });
});

animate();
