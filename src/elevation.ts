import { Loader } from '@googlemaps/js-api-loader';
import { computeDestinationPoint } from 'geolib';

type Meters = number;

type Coords = {
  latitude: number,
  longitude: number,
};

const mapsLoader = new Loader({
  apiKey: ''
});

const mapsLoaderPromise = mapsLoader.load();

const timer = duration => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, duration);
  });
};

const getElevationsBatched = async (locations: Coords[]) => {
  const BATCH_SIZE = 512;
  const google = await mapsLoaderPromise;
  const elevationService = new google.maps.ElevationService();
  const elevations: Meters[] = [];
  let i = 0;
  while (i < locations.length) {
    const batch = locations.slice(i, i + BATCH_SIZE);
    console.log('sending request to elevation service');
    const res = await elevationService.getElevationForLocations({
      locations: batch.map(location => ({
        lat: location.latitude,
        lng: location.longitude
      })),
    });
    const results = res.results.map(result => result.elevation);
    elevations.push(...results);
    i += BATCH_SIZE;
    // await timer(5000);
  }
  return elevations;
};

const getOffsetLocation = (
  location: Coords,
  eastOffset: Meters,
  northOffset: Meters,
) => {
  const r = Math.hypot(eastOffset, northOffset);
  const theta = Math.atan2(northOffset, eastOffset);
  const thetaDeg = theta * 180 / Math.PI;
  const bearing = (360 + 90 - thetaDeg) % 360;
  const point = computeDestinationPoint(location, r, bearing);
  return point;
};

// confirm that elevation api returns points in same order

export const getElevationMap = async (
  location: Coords,
  radius: Meters,
  resolution: Meters
) => {
  const points: Coords[] = [];
  const min = Math.floor(-radius / resolution);
  const max = Math.ceil(radius / resolution);
  for (let x = min; x <= max; x++) {
    for (let y = min; y <= max; y++) {
      const point = getOffsetLocation(location, x * resolution, y * resolution);
      points.push(point);
    }
  }

  const elevations = await getElevationsBatched(points);

  const elevationMap: Meters[][] = [];
  let i = 0;
  for (let x = min; x <= max; x++) {
    const row: Meters[] = [];
    for (let y = min; y <= max; y++) {
      row.push(elevations[i]);
      i++;
    }
    elevationMap.push(row);
  }
  return elevationMap;
};