import * as THREE from 'three';
import {Scene} from './scene';
import Stats from 'stats.js';

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

export class Renderer {
  renderer;
  scene;
  clock;

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
  }

  getRenderTarget() {
    return this.renderer.domElement;
  }

  render() {
    requestAnimationFrame(this.render);
    stats.begin();
    this.scene.update(this.clock.getDelta());
    stats.end();
    this.renderer.render(this.scene, this.scene.getCamera());
    console.log(this.renderer.info.render);
  }

  handleResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const camera = this.scene.getCamera();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
}
