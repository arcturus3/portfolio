import * as THREE from 'three';
import Chance from 'chance';
import {Heightmap} from './heightmap';

import terrainVertexShader from './terrainVertex.glsl?raw';
import terrainFragmentShader from './terrainFragment.glsl?raw';
import pointsVertexShader from './pointsVertex.glsl?raw';
import pointsFragmentShader from './pointsFragment.glsl?raw';

export class Scene extends THREE.Scene {
  heightmaps!: Heightmap[];

  terrainGroup!: THREE.Group;
  pointsGeometry!: THREE.BufferGeometry;
  meshGeometry!: THREE.BufferGeometry;
  mesh!: THREE.Mesh;
  
  pointCount = 100000;
  meshSize = 199; // one less than heightmap size for exact vertex positions
  rotationTimeSeconds = 60;
  morphTimeSeconds = 2;
  
  index = 0;
  morphProgress = 1;
  morphInfluences!: number[];

  constructor(heightmaps: Heightmap[]) {
    super();

    this.heightmaps = heightmaps;

    this.generateMeshGeometry();
    this.generatePointsGeometry();
    this.buildScene();

    this.background = new THREE.Color(0x101010);
  }

  buildScene() {
    // const terrainMaterial = new THREE.ShaderMaterial({
    //   side: THREE.DoubleSide,
    //   uniforms: {
    //     diffuse: {value: [1, 1, 1]},
    //     background: {value: [0.0627, 0.0627, 0.0627]},
    //     light: {value: [1, 2, 2]},

    //   },
    //   vertexShader: terrainVertexShader,
    //   fragmentShader: terrainFragmentShader
    // });

    const terrainMaterial = new THREE.MeshStandardMaterial()

    const pointsMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        diffuse: {value: [1, 1, 1]},
        background: {value: [0.0627, 0.0627, 0.0627]},
      },
      vertexShader: pointsVertexShader,
      fragmentShader: pointsFragmentShader
    });

    const terrainGroup = new THREE.Group();
    terrainGroup.add(new THREE.Points(this.pointsGeometry, pointsMaterial));
    this.meshGeometry.computeVertexNormals();
    this.mesh = new THREE.Mesh(this.meshGeometry, terrainMaterial);
    terrainGroup.add(this.mesh);
    this.add(terrainGroup);
    this.terrainGroup = terrainGroup;

    this.morphInfluences = Array(this.heightmaps.length).fill(0);
    this.morphInfluences[0] = 1;
    this.mesh.morphTargetInfluences = this.morphInfluences;

    // this.applyHeightmapOpacities(this.heightmaps[this.index], this.targetPointsGeometry);
  }

  generateMeshGeometry() {
    const geometry = new THREE.PlaneGeometry(2, 2, this.meshSize, this.meshSize);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, -0.5, 0);

    // geometry.morphAttributes = Object.fromEntries(
    //   this.heightmaps.map((heightmap, index) => [
    //     index,
    //     [this.getPositionFromHeightmap(heightmap, geometry.getAttribute('position') as THREE.BufferAttribute, 0)]
    //   ])
    // );

    geometry.morphAttributes = {
      position: this.heightmaps.map(heightmap => this.getPositionFromHeightmap(heightmap, geometry.getAttribute('position') as THREE.BufferAttribute, 0))
    };

    // geometry.setAttribute('position', this.getPositionFromHeightmap(this.heightmaps[0], geometry.getAttribute('position') as THREE.BufferAttribute, 0));

    this.meshGeometry = geometry;
  }

  generatePointsGeometry() {
    const chance = new Chance();
    const positionBuffer = new Float32Array(this.pointCount * 3);
    const position = new THREE.BufferAttribute(positionBuffer, 3);
    const opacityBuffer = new Float32Array(this.pointCount);
    const opacity = new THREE.BufferAttribute(opacityBuffer, 1);
    for (let i = 0; i < this.pointCount; i++) {
      const x = chance.floating({min: -1, max: 1});
      const z = chance.floating({min: -1, max: 1});
      position.setXYZ(i, x, -0.5, z);
      opacity.setX(i, 0);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', position);
    geometry.setAttribute('opacity', opacity);

    geometry.morphAttributes = {
      position: this.heightmaps.map(heightmap => this.getPositionFromHeightmap(heightmap, geometry.getAttribute('position') as THREE.BufferAttribute, 0.002))
    };

    this.pointsGeometry = geometry;
  }

  getPositionFromHeightmap(heightmap: Heightmap, planePosition: THREE.BufferAttribute, offset: number): THREE.BufferAttribute {
    const maxHeight = heightmap.getHeight(0, 0); // approximate max height
    const positionBuffer = new Float32Array(planePosition.count * 3);
    const position = new THREE.BufferAttribute(positionBuffer, 3);
    for (let i = 0; i < planePosition.count; i++) {
      const x = planePosition.getX(i);
      const z = planePosition.getZ(i);
      const y = heightmap.getHeight(x, z) - maxHeight + offset;
      position.setXYZ(i, x, y, z);
    }
    return position;
  }

  getOpacityFromHeightmap(heightmap: Heightmap, planePosition: THREE.BufferAttribute): THREE.BufferAttribute {
    const getOpacity = (x: number, z: number) => {
      const threshold = 0.5;
      const radius = Math.min(Math.hypot(x, z), 1);
      if (radius <= threshold)
        return 1;
      else
        return 1 - THREE.MathUtils.smoothstep(radius, threshold, 1);
    };

    const getSlope = (x: number, z: number) => {
      const epsilon = 0.001;
      const a = new THREE.Vector3(epsilon, heightmap.getHeight(x + epsilon, z) - heightmap.getHeight(x, z), 0);
      const b = new THREE.Vector3(0, heightmap.getHeight(x, z + epsilon) - heightmap.getHeight(x, z), epsilon);
      const normal = new THREE.Vector3().crossVectors(b, a).normalize();
      return normal.y ** 6;
    }

    const opacityBuffer = new Float32Array(planePosition.count);
    const opacity = new THREE.BufferAttribute(opacityBuffer, 1);
    for (let i = 0; i < planePosition.count; i++) {
      const x = planePosition.getX(i);
      const z = planePosition.getZ(i);
      opacity.setX(i, getOpacity(x, z) * getSlope(x, z));
    }
    return opacity;
  }

  setHeightmap(index: number) {
    if (this.morphProgress < 1) {
      return false;
    }
    this.morphProgress = 0;
    this.index = index;
    console.log(this.index)
    return true;
  }

  updateMorphInfluences(dt: number) {
    this.morphProgress = Math.min(1, this.morphProgress + dt / this.morphTimeSeconds);
    const morphInfluence = THREE.MathUtils.smootherstep(this.morphProgress, 0, 1);
    const currIndex = this.index;
    const lastIndex = (this.heightmaps.length + currIndex - 1) % this.heightmaps.length;
    this.morphInfluences[lastIndex] = 1 - morphInfluence;
    this.morphInfluences[currIndex] = morphInfluence;

    this.mesh.morphTargetInfluences = this.morphInfluences;
    // this.mesh.updateMorphTargets();
  }

  update(deltaSeconds: number) {
    const angle = 2 * Math.PI * .01 / this.rotationTimeSeconds;
    this.terrainGroup.rotateY(angle);

    this.updateMorphInfluences(deltaSeconds);
    // this.mesh.updateMorphTargets();
  }
}
