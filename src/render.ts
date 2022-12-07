import * as THREE from 'three';
import {MeshBasicMaterial, Vector3} from 'three';
import {VertexNormalsHelper} from 'three/examples/jsm/helpers/VertexNormalsHelper';
import { getElevationMap } from './elevation';


const mountWashington = {
  latitude: 44.2691622567,
  longitude: -71.3020887916
};

const jungfrau = {
  latitude: 46.53677,
  longitude: 7.96259
};

const haleakala = {
  latitude: 20.70149,
  longitude: -156.17328
};


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


const getHeightMap2 = async (): Promise<THREE.Texture> => {
  const lonePeak = {
    latitude: 45.278056,
    longitude: -111.450278,
  };
  const radius = 1000;
  const resolution = 25;
  const elevationMap = await getElevationMap(haleakala, radius, resolution);
  const size = elevationMap.length;

  const flatElevations = elevationMap.flat();
  const minElevation = Math.min(...flatElevations);
  const maxElevation = Math.max(...flatElevations);
  const normalizedElevations = flatElevations.map(elevation => (
    (elevation - minElevation) / (maxElevation - minElevation) * 255
  ));

  const data = new Uint8Array(4 * size ** 2);
  for (let i = 0; i < size ** 2; i++) {
    const stride = i * 4;
    data[stride] = normalizedElevations[i];
    data[stride + 1] = normalizedElevations[i];
    data[stride + 2] = normalizedElevations[i];
    data[stride + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.needsUpdate = true;
  return texture;
};

const getHeightMap = async (): Promise<Uint8Array> => {
  const lonePeak = {
    latitude: 45.278056,
    longitude: -111.450278,
  };
  const radius = 450;
  const resolution = 30;
  const elevationMap = await getElevationMap(lonePeak, radius, resolution);
  const size = elevationMap.length;

  const flatElevations = elevationMap.flat();
  const minElevation = Math.min(...flatElevations);
  const maxElevation = Math.max(...flatElevations);
  const normalizedElevations = flatElevations.map(elevation => (
    (elevation - minElevation) / (maxElevation - minElevation) * 255
  ));

  return new Uint8Array(normalizedElevations);
};

const data = await getHeightMap();

const size = Math.floor(Math.sqrt(data.length));
const terrainGeometry = new THREE.PlaneGeometry(1, 1, size - 1, size - 1);
terrainGeometry.rotateX(-Math.PI / 2);
const vertices = terrainGeometry.getAttribute('position');
for (let i = 0; i < vertices.count; i++) {
  vertices.setY(i, data[i] * 0.002);
}
vertices.needsUpdate = true;

// const terrainMaterial = new MeshBasicMaterial({
//   color: 0x000000,
//   polygonOffset: true,
//   polygonOffsetFactor: 1,
//   polygonOffsetUnits: 1,
// });

// const terrainMaterial = new THREE.ShaderMaterial({
//   uniforms: {'thickness': 1},
//   vertexShader: `
//     attribute vec3 center;
//     varying vec3 vCenter;
//     void main() {
//       vCenter = center;
//       gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
//     }
//   `,
//   fragmentShader: `
//     uniform float thickness;
//     varying vec3 vCenter;
//     void main() {
//       vec3 afwidth = fwidth( vCenter.xyz );
//       vec3 edge3 = smoothstep( ( thickness - 1.0 ) * afwidth, thickness * afwidth, vCenter.xyz );
//       float edge = 1.0 - min( min( edge3.x, edge3.y ), edge3.z );
//       gl_FragColor.rgb = gl_FrontFacing ? vec3( 0.9, 0.9, 1.0 ) : vec3( 0.4, 0.4, 0.5 );
//       gl_FragColor.a = edge;
//     }
//   `,
//   side: THREE.DoubleSide,
//   alphaToCoverage: true
// });
// terrainMaterial.extensions.derivatives = true;

const terrainMaterial = new THREE.MeshStandardMaterial({
  color: 0x101010,
  flatShading: false,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
  roughness: 1,
  metalness: 0,
});

terrainGeometry.computeVertexNormals();
terrainGeometry.normalizeNormals();

const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);


scene.add(terrain);

// const light = new THREE.AmbientLight();
const light = new THREE.PointLight();
light.power = 20;
light.position.x = 10;
light.position.y = 10;


scene.add(light);

const normals = new VertexNormalsHelper(terrain);
// scene.add(normals);


// const wireframeGeometry = new THREE.WireframeGeometry(terrainGeometry);
// const wireframeMaterial = new THREE.LineBasicMaterial({
//   color: 0x444444,
//   opacity: 0.5,
//   alphaToCoverage: true
// });
// const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
// terrain.add(wireframe);

const wireframeGeometry2 = terrainGeometry;
const wireframeMaterial2 = new THREE.PointsMaterial({
  size: 0.004,
  color: 0x444444,
});
const wireframe2 = new THREE.Points(wireframeGeometry2, wireframeMaterial2);
terrain.add(wireframe2);



camera.position.y = 0.5;
camera.position.z = 1;
camera.lookAt(new Vector3(0, 0, 0));

const animate = () => {
  requestAnimationFrame(animate);
  terrain.rotateY(0.001);
  renderer.render(scene, camera);
};

animate();






// const material = new THREE.MeshStandardMaterial({
  // wireframe: true,
  // flatShading: true,
  // displacementMap: await getHeightMap(),
  // displacementScale: 2,
  // polygonOffset: true,
  // polygonOffsetFactor: 1, // positive value pushes polygon further away
  // polygonOffsetUnits: 1,
// });




// const texture = await getHeightMap2();
// const geometry = new THREE.PlaneGeometry();
// const material = new THREE.MeshBasicMaterial();
// material.map = texture;
// const mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh);