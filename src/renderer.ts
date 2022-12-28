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

  constructor(canvas: HTMLCanvasElement, scene: Scene) {
    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);

    this.scene = scene;
    this.clock = new THREE.Clock();
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });
    this.renderer.setClearColor(0x101010);

    const camera = new THREE.PerspectiveCamera();
    camera.near = 0.01;
    camera.position.set(0, 0.6, 2.2);
    camera.lookAt(new THREE.Vector3(0, -0.25, 0));
    this.camera = camera;
  }

  getFov(aspect: number) {
    const minHorizontalFov = 40;
    const minVerticalFov = 40;
    if (aspect >= minHorizontalFov / minVerticalFov) {
      const verticalFov = minVerticalFov;
      return verticalFov
    }
    else {
      const horizontalFov = minHorizontalFov;
      const horizontalFovRad = THREE.MathUtils.degToRad(horizontalFov);
      const verticalFovRad = Math.atan(Math.tan(horizontalFovRad / 2) / aspect) * 2;
      const verticalFov = THREE.MathUtils.radToDeg(verticalFovRad);
      return verticalFov;
    }
  }

  resize() {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      this.renderer.setSize(width, height, false);
      const aspect = width / height;
      this.camera.aspect = aspect;
      this.camera.fov = this.getFov(aspect);
      this.camera.updateProjectionMatrix();
    }
  }

  render() {
    requestAnimationFrame(this.render);
    stats.begin();
    this.resize();
    this.scene.update(this.clock.getDelta());
    this.renderer.render(this.scene, this.camera);
    stats.end();
  }
}
