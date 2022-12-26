import * as THREE from 'three';
import {Scene} from './scene';
import Stats from 'stats.js';

const stats = new Stats();
stats.showPanel(0);
const elem = stats.dom;
elem.style.left = 'initial';
elem.style.right = '0';
document.body.appendChild(elem);

export class Renderer {
  renderer;
  scene;
  clock;
  camera;

  constructor(scene: Scene) {
    this.render = this.render.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.scene = scene;
    this.clock = new THREE.Clock();
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // this.renderer.setPixelRatio(2);

    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.01, 1000);
    camera.position.y = 0.75;
    camera.position.z = 1.5;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.camera = camera;
  }

  getRenderTarget() {
    return this.renderer.domElement;
  }

  render() {
    requestAnimationFrame(this.render);
    stats.begin();
    this.scene.update(this.clock.getDelta());
    stats.end();
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const camera = this.scene.getCamera();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
}
