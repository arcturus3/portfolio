import * as THREE from 'three';
import {Scene} from './scene';

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
  }

  getRenderTarget() {
    return this.renderer.domElement;
  }

  render() {
    requestAnimationFrame(this.render);
    this.scene.update(this.clock.getDelta());
    this.renderer.render(this.scene, this.scene.getCamera());
  }

  handleResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const camera = this.scene.getCamera();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
}
