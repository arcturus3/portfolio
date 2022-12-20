import rawMountainData from '../heightmap_generator/data/result.json?raw';

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
  heightmap: Float32Array,
};

const parsedMountainData: RawMountain[] = JSON.parse(rawMountainData);

export const mountainData: Mountain[] = parsedMountainData.map(mountain => {
  const bytes = window.atob(mountain.heightmap);
  const buffer = Uint8Array.from(bytes, c => c.charCodeAt(0)).buffer;
  const array = new Float32Array(buffer);
  return {
    ...mountain,
    heightmap: array
  };
});
