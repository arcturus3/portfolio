import * as THREE from 'three';
import {VertexNormalsHelper} from 'three/examples/jsm/helpers/VertexNormalsHelper';
import test from '/heightmap_generator/data/heightmaps/lone_mountain.png';
import {getPng} from './utils';
import Jimp from 'jimp';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const getHeightMap = () => {
  console.log(Jimp.read(test));

  const canvas = document.createElement( 'canvas' );
	canvas.width = texture;
	canvas.height = texture.image.height;
	
	const context = canvas.getContext( '2d' )!;
	context.drawImage( texture.image, 0, 0 );
	
	const data = context.getImageData( 0, 0, canvas.width, canvas.height );
	console.log( data );
};

const data = getHeightMap();

const size = Math.floor(Math.sqrt(data.length));
const terrainGeometry = new THREE.PlaneGeometry(1, 1, size - 1, size - 1);
terrainGeometry.rotateX(-Math.PI / 2);
const vertices = terrainGeometry.getAttribute('position');
for (let i = 0; i < vertices.count; i++) {
  vertices.setY(i, data[i] * 0.002);
}
vertices.needsUpdate = true;


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
const normals = new VertexNormalsHelper(terrain);
// scene.add(normals);



scene.add(terrain);

// const light = new THREE.AmbientLight();
const light = new THREE.PointLight();
light.power = 20;
light.position.x = 10;
light.position.y = 10;
// scene.add(light);



const wireframeGeometry = new THREE.WireframeGeometry(terrainGeometry);
const wireframeMaterial = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.05,
});
const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
wireframe.renderOrder = 1;
terrain.add(wireframe);

const wireframeGeometry2 = terrainGeometry;
const wireframeMaterial2 = new THREE.PointsMaterial({
  size: 0.001,
  color: 0xffffff,
  transparent: true,
  opacity: 0.2,
});
const wireframe2 = new THREE.Points(wireframeGeometry2, wireframeMaterial2);
wireframe2.renderOrder = 0;
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
