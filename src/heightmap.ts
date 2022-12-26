import * as THREE from 'three';

export class Heightmap {
  data: Float32Array;
  size: number;

  constructor(data: Float32Array) {
    this.data = data;
    this.size = Math.floor(Math.sqrt(data.length));
  }

  getSize() {
    return this.size;
  }

  // get value from data matrix
  // row, col discrete in [0, size - 1]
  getValue(row: number, col: number) {
    return this.data[row * this.size + col];
  }

  // bilinearly interpolate height value and scale proportionally width and height
  // x, z continuous in [-1, 1]
  getHeight(x: number, z: number) {
    const row = (z + 1) / 2 * (this.size - 1);
    const col = (x + 1) / 2 * (this.size - 1);
    const topRow = Math.floor(row);
    const bottomRow = Math.ceil(row);
    const leftCol = Math.floor(col);
    const rightCol = Math.ceil(col);
    const tl = this.getValue(topRow, leftCol);
    const tr = this.getValue(topRow, rightCol);
    const bl = this.getValue(bottomRow, leftCol);
    const br = this.getValue(bottomRow, rightCol);
    const t = THREE.MathUtils.lerp(tl, tr, col - leftCol);
    const b = THREE.MathUtils.lerp(bl, br, col - leftCol);
    const height = THREE.MathUtils.lerp(t, b, row - topRow);
    const normalizedHeight = height * 2 / (this.size - 1);
    return normalizedHeight;
  }
}
