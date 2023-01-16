import Chance from 'chance';
import { Heightmap } from './heightmap';
import rawMountainData from '/generated/mountain_data.json?raw';

type BaseMountain = {
  id: string,
  name: string,
  coords: [number, number],
  elevation: number,
  radius: number,
};

type RawMountain = BaseMountain & {
  heightmap: string,
};

export type Mountain = BaseMountain & {
  heightmap: Heightmap,
};

const parseBase64 = (data: string): ArrayBuffer => {
  const bytes = window.atob(data);
  const buffer = Uint8Array.from(bytes, c => c.charCodeAt(0)).buffer;
  return buffer;
};

const parsedMountainData: RawMountain[] = JSON.parse(rawMountainData);

const mountainData: Mountain[] = parsedMountainData.map(mountain => {
  const buffer = parseBase64(mountain.heightmap);
  const array = new Float32Array(buffer);
  return {
    ...mountain,
    heightmap: new Heightmap(array)
  };
});

const chance = new Chance();
const shuffledMountainData = chance.shuffle(mountainData);

export {shuffledMountainData as mountainData};
