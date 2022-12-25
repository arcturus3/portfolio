import * as THREE from 'three';
import Chance from 'chance';

export class Scene extends THREE.Scene {
  camera!: THREE.PerspectiveCamera;
  terrain!: THREE.Object3D;
  secondsPerRotation = 60;

  constructor(heightmap: Float32Array) {
    super();
    this.buildCamera();
    this.buildLights();
    this.buildTerrain(heightmap);
  }

  buildCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 10000);
    this.camera.position.y = 0.35;
    this.camera.position.z = 0.75;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  buildLights() {
    const light = new THREE.PointLight();
    light.intensity = 8;
    light.position.x = 100;
    light.position.y = 100;
    this.add(light);

    const temp = new THREE.AmbientLight();
    temp.intensity = 2;
    this.add(temp);

    const light2 = new THREE.PointLight();
    light2.intensity = 10;
    light.position.y = 100;
    this.add(light2);
  }

  // need to prevent underside of mesh from showing, maybe drop at edges
  // need to fix bright highlights on mesh
  buildTerrain(heightmap: Float32Array) {
    const loader = new THREE.TextureLoader();
    const alphaMap = loader.load('/alpha_map.png');

    const terrainGeometry = this.buildTerrainGeometry(heightmap);
    const pointsGeometry = this.buildPointsGeometry(heightmap);

    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      transparent: true,
      alphaMap: alphaMap,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      size: 0.001,
    });
    // to prevent underside of terrain showing due to transparent edges
    const coverMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 1,
    });

    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    const cover = new THREE.Mesh(terrainGeometry, coverMaterial);

    const group = new THREE.Group();
    group.add(terrain);
    group.add(points);
    group.add(cover);
    this.add(group);
    this.terrain = group;
  }

  lerp(a: number, b: number, t: number) {
    return (1 - t) * a + t * b;
  }

  // x and z in [0, 1]
  // either returns nearest height or performs bilinear interpolation
  getHeight(heightmap: Float32Array, x: number, z: number, interpolate: boolean) {
    const size = Math.floor(Math.sqrt(heightmap.length));
    const row = (size - 1) * z;
    const col = (size - 1) * x;
    if (interpolate) {
      const prevRow = Math.floor(row);
      const nextRow = Math.ceil(row);
      const prevCol = Math.floor(col);
      const nextCol = Math.ceil(col);
      const a = heightmap[prevRow * size + prevCol];
      const b = heightmap[prevRow * size + nextCol];
      const c = heightmap[nextRow * size + prevCol];
      const d = heightmap[nextRow * size + nextCol];
      const e = this.lerp(a, b, col - prevCol);
      const f = this.lerp(c, d, col - prevCol);
      const g = this.lerp(e, f, row - prevRow);
      return g / (size - 1);
    }
    else {
      const nearestRow = Math.round(row);
      const nearestCol = Math.round(col);
      return heightmap[nearestRow * size + nearestCol] / (size - 1);
    }
  }

  buildTerrainGeometry(heightmap: Float32Array) {
    const size = Math.floor(Math.sqrt(heightmap.length));
    const terrainGeometry = new THREE.PlaneGeometry(1, 1, size - 1, size - 1);
    terrainGeometry.rotateX(-Math.PI / 2);
    const vertices = terrainGeometry.getAttribute('position');
    // provide reference to heightmap buffer instead?
    for (let i = 0; i < vertices.count; i++) {
      vertices.setY(i, heightmap[i] / (size - 1));
    }
    terrainGeometry.computeVertexNormals();
    terrainGeometry.normalizeNormals();
    vertices.needsUpdate = true;
    return terrainGeometry;
  }

  buildPointsGeometry(heightmap: Float32Array) {
    const points = 10000;
    const chance = new Chance();
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(points * 3);
    let count = 0;
    while (count < points) {
      const x = chance.normal({dev: 0.16});
      const z = chance.normal({dev: 0.16});
      if (Math.hypot(x, z) > 0.5) {
        continue;
      }
      const y = this.getHeight(heightmap, x + 0.5, z + 0.5, true);
      vertices[count * 3] = x;
      vertices[count * 3 + 1] = y;
      vertices[count * 3 + 2] = z;
      count++;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geometry;
  }

  getCamera() {
    return this.camera;
  }

  update(timeDelta: number) {
    const angle = 2 * Math.PI * timeDelta / this.secondsPerRotation
    this.terrain.rotateY(angle);
  }

  handleHeightmapChange(heightmap: Float32Array) {
    this.remove(this.terrain);
    this.buildTerrain(heightmap);
  }
}
