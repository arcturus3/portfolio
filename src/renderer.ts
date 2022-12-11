import * as THREE from 'three';
import {Scene} from './scene';

export class Renderer {
  renderer;
  scene;

  constructor(scene: Scene) {
    this.scene = scene;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  getRenderTarget() {
    return this.renderer.domElement;
  }

  start() {
    requestAnimationFrame(this.start);
    this.renderer.render(this.scene, this.scene.getCamera());
  }
}
