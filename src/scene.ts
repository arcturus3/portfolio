import * as THREE from 'three';
import Chance from 'chance';
import {Heightmap} from './heightmap';

export class Scene extends THREE.Scene {
  terrainGroup!: THREE.Group;
  pointsGeometry!: THREE.BufferGeometry;
  meshGeometry!: THREE.BufferGeometry;

  // maintain start and end geometries for morphing
  // interpolating heightmap and heights at each step is rather slow
  originPointsGeometry!: THREE.BufferGeometry;
  targetPointsGeometry!: THREE.BufferGeometry;
  originMeshGeometry!: THREE.BufferGeometry;
  targetMeshGeometry!: THREE.BufferGeometry;
  morphFactor = 1;

  pointCount = 300000;
  meshSize = 199; // one less than heightmap size for exact vertex positions
  alphaMapSize = 1000;
  rotationTimeSeconds = 60;
  morphTimeSeconds = 2;

  constructor() {
    super();
    this.generateMeshGeometry();
    this.generatePointsGeometry();
    this.buildScene();

    this.background = new THREE.Color(0x101010);
    this.fog = new THREE.Fog(0x101010, 1, 2);
  }

  buildScene() {
    const loader = new THREE.TextureLoader();
    const alphaMap = loader.load('/alpha_map.png');
    // const alphaMap = this.generateAlphaMap();
    // const pointsMaterial = new THREE.PointsMaterial({
    //   color: 0xffffff,
    //   transparent: true,
    //   opacity: 0.1,
    //   size: 0.001,
    // });
    // const terrainMaterial = new THREE.MeshStandardMaterial({
      // color: 0xffffff,
      // transparent: true,
      // alphaMap: alphaMap,
      // polygonOffset: true,
      // polygonOffsetFactor: 1,
      // polygonOffsetUnits: 1,
    // });
    // to prevent underside of terrain showing due to transparent edges
    // const coverMaterial = new THREE.MeshBasicMaterial({
    //   color: 0x101010,
    //   polygonOffset: true,
    //   polygonOffsetFactor: 2,
    //   polygonOffsetUnits: 1,
    // });

    const terrainMaterial = new THREE.ShaderMaterial({
      // transparent: true,
      uniforms: {
        diffuse: {value: [1, 1, 1]},
        background: {value: [0.0627, 0.0627, 0.0627]},
        // background: {value: [1, 0, 0]},
        light: {value: [1, 2, 2]},

      },
      vertexShader: `
        varying vec3 modelPosition;
        varying vec3 viewPosition;
        varying vec3 viewNormal;

        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
          modelPosition = vec3(modelMatrix * vec4(position, 1.));
          viewPosition = vec3(modelViewMatrix * vec4(position, 1.));
          viewNormal = normalMatrix * normal;
        }
      `,
      fragmentShader: `
        uniform vec3 diffuse;
        uniform vec3 background;
        uniform vec3 light;
        varying vec3 modelPosition;
        varying vec3 viewPosition;
        varying vec3 viewNormal;

        float rand(vec2 co){
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        float get_opacity(vec3 position) {
          const float threshold = 0.5;
          float radius = clamp(length(vec2(position.x, position.z)), 0.0, 1.0);
          if (radius <= threshold)
            return 1.0;
          else
            return 1.0 - smoothstep(threshold, 1.0, radius) + mix(-2.5/255.0, 2.5/255.0, rand(vec2(position.x, position.z))); // dithering
        }

        void main() {
          // vec3 light_ray = normalize(light - modelPosition);
          vec3 light_pos = normalize(vec3(1, 1, 1));
          float intensity = max(0.0, dot(viewNormal, light_pos));
          float half_lambert_intensity = 0.1 * pow(0.5 * intensity + 0.5, 2.0);
          vec3 lit_diffuse = 0.1 * intensity * diffuse;
          // vec3 lit_diffuse = half_lambert_intensity * diffuse;
          vec3 color = mix(background, lit_diffuse, get_opacity(modelPosition));
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    const pointsMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        diffuse: {value: [1, 1, 1]},
        background: {value: [0.0627, 0.0627, 0.0627]},
      },
      vertexShader: `
        attribute float opacity;
        varying vec3 frag_position;
        varying float frag_opacity;

        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          // gl_PointSize = 1.5;
          frag_position = vec3(position);
          frag_opacity = opacity;
        }
      `,
      fragmentShader: `
        uniform vec3 diffuse;
        varying vec3 frag_position;
        varying float frag_opacity;

        void main() {
          gl_FragColor = vec4(diffuse, frag_opacity);
        }
      `
    });

    const terrainGroup = new THREE.Group();
    terrainGroup.add(new THREE.Points(this.pointsGeometry, pointsMaterial));
    this.meshGeometry.computeVertexNormals();
    // terrainGroup.add(new THREE.Mesh(this.meshGeometry, new THREE.MeshStandardMaterial()));
    terrainGroup.add(new THREE.Mesh(this.meshGeometry, terrainMaterial));
    // terrainGroup.add(new THREE.Mesh(this.meshGeometry, coverMaterial));
    this.add(terrainGroup);
    this.terrainGroup = terrainGroup;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.01);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.01);
    directionalLight.position.set(2, 1, 0);
    this.add(ambientLight, directionalLight);
  }

  generateMeshGeometry() {
    const geometry = new THREE.PlaneGeometry(2, 2, this.meshSize, this.meshSize);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, -0.5, 0);
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
    this.pointsGeometry = geometry;
  }

  generateAlphaMap() {
    const size = this.alphaMapSize;
    const center = (size - 1) / 2;
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        let value;
        if (Math.hypot(i - center, j - center) <= center) {
          value = 255;
        }
        else {
          value = 0;
        }
        const index = i * size + j;
        data[index] = value;
        data[index + 1] = value;
        data[index + 2] = value;
        data[index + 3] = value;
      }
    }
    const texture = new THREE.DataTexture(data, size, size);
    texture.needsUpdate = true;
    return texture;
  }

  applyHeightmap(heightmap: Heightmap, geometry: THREE.BufferGeometry) {
    const maxHeight = heightmap.getHeight(0, 0); // approximate max height
    const position = geometry.getAttribute('position');
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const y = heightmap.getHeight(x, z) - maxHeight;
      position.setY(i, y);
    }
    position.needsUpdate = true;
  }

  applyHeightmapOpacities(heightmap: Heightmap, points: THREE.BufferGeometry) {
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
      return normal.y ** 8;
    }

    const position = points.getAttribute('position');
    const opacity = points.getAttribute('opacity');
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      opacity.setX(i, getOpacity(x, z) * getSlope(x, z));
    }
    opacity.needsUpdate = true;
  }

  setHeightmap(heightmap: Heightmap) {
    if (this.morphFactor < 1) {
      return false;
    }
    this.morphFactor = 0;
    this.originMeshGeometry = this.meshGeometry.clone();
    this.targetMeshGeometry = this.meshGeometry.clone();
    this.originPointsGeometry = this.pointsGeometry.clone();
    this.targetPointsGeometry = this.pointsGeometry.clone();
    this.applyHeightmap(heightmap, this.targetMeshGeometry);
    this.applyHeightmap(heightmap, this.targetPointsGeometry);
    this.applyHeightmapOpacities(heightmap, this.targetPointsGeometry);
    return true;
  }

  lerpVertices(out: THREE.BufferGeometry, origin: THREE.BufferGeometry, target: THREE.BufferGeometry, factor: number) {
    const outPosition = out.getAttribute('position');
    const originPosition = origin.getAttribute('position');
    const targetPosition = target.getAttribute('position');
    for (let i = 0; i < outPosition.count; i++) {
      outPosition.setX(i, THREE.MathUtils.lerp(originPosition.getX(i), targetPosition.getX(i), factor));
      outPosition.setY(i, THREE.MathUtils.lerp(originPosition.getY(i), targetPosition.getY(i), factor));
      outPosition.setZ(i, THREE.MathUtils.lerp(originPosition.getZ(i), targetPosition.getZ(i), factor));
    }
    outPosition.needsUpdate = true;
  }

  lerpVerticesOpacities(out: THREE.BufferGeometry, origin: THREE.BufferGeometry, target: THREE.BufferGeometry, factor: number) {
    const outOpacity = out.getAttribute('opacity');
    const originOpacity = origin.getAttribute('opacity');
    const targetOpacity = target.getAttribute('opacity');
    for (let i = 0; i < outOpacity.count; i++) {
      outOpacity.setX(i, THREE.MathUtils.lerp(originOpacity.getX(i), targetOpacity.getX(i), factor));
    }
    outOpacity.needsUpdate = true;
  }

  update(deltaSeconds: number) {
    const angle = 2 * Math.PI * deltaSeconds / this.rotationTimeSeconds;
    this.terrainGroup.rotateY(angle);

    if (this.morphFactor < 1) {
      this.morphFactor += deltaSeconds / this.morphTimeSeconds;
      this.morphFactor = Math.min(1, this.morphFactor);
      const smoothedFactor = THREE.MathUtils.smootherstep(this.morphFactor, 0, 1);
      this.lerpVertices(this.meshGeometry, this.originMeshGeometry, this.targetMeshGeometry, smoothedFactor);
      this.lerpVertices(this.pointsGeometry, this.originPointsGeometry, this.targetPointsGeometry, smoothedFactor);
      this.lerpVerticesOpacities(this.pointsGeometry, this.originPointsGeometry, this.targetPointsGeometry, smoothedFactor);
      this.meshGeometry.computeVertexNormals();
      this.meshGeometry.normalizeNormals();
    }
  }
}
