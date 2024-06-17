import * as THREE from 'three';
import Chance from 'chance';
import {Heightmap} from './heightmap';

import meshVertexShader from './meshVertex.glsl?raw';
import meshFragmentShader from './meshFragment.glsl?raw';
import pointsVertexShader from './pointsVertex.glsl?raw';
import pointsFragmentShader from './pointsFragment.glsl?raw';

export class Scene extends THREE.Scene {
  mesh!: THREE.Mesh;
  points!: THREE.Points;
  prevHeightmap!: Heightmap;
  
  pointCount = 100000;
  meshSize = 199; // one less than heightmap size for exact vertex positions
  rotationTimeSeconds = 60;
  morphTimeSeconds = 2;
  morphProgress = 1;

  constructor(initialHeightmap: Heightmap) {
    super();
    this.background = new THREE.Color(0x101010);
    this.prevHeightmap = initialHeightmap;
    this.setHeightmap(initialHeightmap);
  }

  getPositionFromHeightmap(heightmap: Heightmap, planePosition: THREE.BufferAttribute, offset: number): THREE.BufferAttribute {
    const maxHeight = heightmap.getHeight(0, 0); // approximate max height
    const position = new THREE.BufferAttribute(new Float32Array(planePosition.count * 3), 3);
    for (let i = 0; i < planePosition.count; i++) {
      const x = planePosition.getX(i);
      const z = planePosition.getZ(i);
      const y = heightmap.getHeight(x, z) - maxHeight + offset;
      position.setXYZ(i, x, y, z);
    }
    return position;
  }

  generateMeshGeometry(heightmap: Heightmap): THREE.BufferGeometry {
    const geometry = new THREE.PlaneGeometry(2, 2, this.meshSize, this.meshSize);
    geometry.rotateX(-Math.PI / 2);
    const planePosition = geometry.getAttribute('position') as THREE.BufferAttribute;
    const position = this.getPositionFromHeightmap(heightmap, planePosition, 0);
    geometry.setAttribute('position', position);
    geometry.computeVertexNormals();
    geometry.normalizeNormals();
    return geometry;
  }

  generatePointsGeometry(heightmap: Heightmap): THREE.BufferGeometry {
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
    };

    const chance = new Chance();
    const geometry = new THREE.BufferGeometry();
    const planePosition = new THREE.BufferAttribute(new Float32Array(this.pointCount * 3), 3);
    const opacity = new THREE.BufferAttribute(new Float32Array(this.pointCount), 1);
    for (let i = 0; i < this.pointCount; i++) {
      const x = chance.floating({min: -1, max: 1});
      const z = chance.floating({min: -1, max: 1});
      planePosition.setXYZ(i, x, 0, z);
      opacity.setX(i, getOpacity(x, z) * getSlope(x, z));
    }
    const position = this.getPositionFromHeightmap(heightmap, planePosition, 0.002);
    geometry.setAttribute('position', position);
    geometry.setAttribute('opacity', opacity);
    return geometry;
  }

  generateMesh(initialGeometry: THREE.BufferGeometry, finalGeometry: THREE.BufferGeometry): THREE.Mesh {
    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        morphInfluence: {value: 0},
        diffuse: {value: [1, 1, 1]},
        background: {value: [0.0627, 0.0627, 0.0627]},
        light: {value: [1, 2, 2]},
      },
      vertexShader: meshVertexShader,
      fragmentShader: meshFragmentShader
    });
    // const geometry = new THREE.BufferGeometry();
    const geometry = finalGeometry.clone();
    geometry.setAttribute('initialPosition', initialGeometry.getAttribute('position'));
    geometry.setAttribute('initialNormal', initialGeometry.getAttribute('normal'));
    // geometry.setAttribute('position', finalGeometry.getAttribute('position'));
    // geometry.setAttribute('normal', finalGeometry.getAttribute('normal'));
    // return new THREE.Mesh(finalGeometry, new THREE.MeshBasicMaterial({color: 'white', wireframe: true}));
    return new THREE.Mesh(geometry, material);
  }

 generatePoints(initialGeometry: THREE.BufferGeometry, finalGeometry: THREE.BufferGeometry): THREE.Points {
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        diffuse: {value: [1, 1, 1]},
        background: {value: [0.0627, 0.0627, 0.0627]},
      },
      vertexShader: pointsVertexShader,
      fragmentShader: pointsFragmentShader
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('initialPosition', initialGeometry.getAttribute('position'));
    geometry.setAttribute('initialOpacity', initialGeometry.getAttribute('opacity'));
    geometry.setAttribute('position', finalGeometry.getAttribute('position'));
    geometry.setAttribute('opacity', finalGeometry.getAttribute('opacity'));
    return new THREE.Points(geometry, material);
  }

  setHeightmap(heightmap: Heightmap) {
    if (this.morphProgress < 1) return false;
    this.morphProgress = 0;
    const mesh = this.generateMesh(
      this.generateMeshGeometry(this.prevHeightmap),
      this.generateMeshGeometry(heightmap)
    );
    this.remove(this.mesh);
    this.add(mesh);
    this.mesh = mesh;
    this.prevHeightmap = heightmap;
    // const points = this.generatePoints(
    //   this.generatePointsGeometry(this.prevHeightmap),
    //   this.generatePointsGeometry(heightmap)
    // );
    // this.points = points;
    // this.add(points);
    return true;
  }

  update(dt: number) {
    const angle = 2 * Math.PI * dt / this.rotationTimeSeconds;
    this.rotateY(angle);
    this.morphProgress = Math.min(1, this.morphProgress + dt / this.morphTimeSeconds);
    const morphInfluence = THREE.MathUtils.smootherstep(this.morphProgress, 0, 1);
    this.mesh.material.uniforms.morphInfluence.value = morphInfluence;
    this.mesh.material.uniformsNeedUpdate = true;
  }
}
