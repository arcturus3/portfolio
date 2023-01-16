import os
import json
import base64
import asyncio
import aiohttp
import numpy as np
import geopy
import geopy.distance
import rasterio
from rasterio.crs import CRS
from rasterio.warp import calculate_default_transform, reproject, Resampling
from PIL import Image


async def fetch_dem(session, dst_filename, center, radius):
    distance = geopy.distance.distance(meters=radius)
    url = 'https://portal.opentopography.org/API/globaldem'
    params = {
        'API_Key': os.environ['OPEN_TOPOGRAPHY_API_KEY'],
        'demtype': 'COP30',
        'outputFormat': 'GTiff',
        'north': distance.destination(center, bearing=0).latitude,
        'east': distance.destination(center, bearing=90).longitude,
        'south': distance.destination(center, bearing=180).latitude,
        'west': distance.destination(center, bearing=270).longitude,
    }
    async with session.get(url, params=params) as response:
        with open(dst_filename, 'wb') as file:
            file.write(await response.read())


def reproject_dem(src_filename, dst_filename):
    dst_crs = CRS.from_epsg(3857)
    with rasterio.open(src_filename) as src:
        transform, width, height = calculate_default_transform(
            src.crs,
            dst_crs,
            src.width,
            src.height,
            *src.bounds
        )
        dst_meta = src.meta.copy()
        dst_meta.update({
            'crs': dst_crs,
            'transform': transform,
            'width': width,
            'height': height,
        })
        with rasterio.open(dst_filename, 'w', **dst_meta) as dst:
            for i in range(1, src.count + 1):
                reproject(
                    source=rasterio.band(src, i),
                    destination=rasterio.band(dst, i),
                    src_transform=src.transform,
                    src_crs=src.crs,
                    dst_transform=transform,
                    dst_crs=dst_crs,
                    resampling=Resampling.cubic
                )


def read_dem(src_filename):
    with rasterio.open(src_filename) as dem:
        data = dem.read(1)
    return data.astype(np.float32)


def normalize_heightmap(heightmap):
    min_elevation = np.min(heightmap)
    max_elevation = np.max(heightmap)
    return (heightmap - min_elevation) / (max_elevation - min_elevation)


def write_image(heightmap, dst_filename):
    heightmap = normalize_heightmap(heightmap)
    heightmap = (heightmap * np.iinfo(np.uint8).max).astype(np.uint8)
    image = Image.fromarray(heightmap)
    image.save(dst_filename)


def resize_heightmap(heightmap, size_pixels):
    min_elevation = np.min(heightmap)
    max_elevation = np.max(heightmap)
    heightmap = normalize_heightmap(heightmap)
    image = Image.fromarray(heightmap)
    image = image.resize((size_pixels, size_pixels), Image.Resampling.BICUBIC)
    heightmap = np.array(image)
    return min_elevation + (max_elevation - min_elevation) * heightmap


def rescale_elevations(heightmap, size_meters):
    size_pixels = heightmap.shape[0]
    pixels_per_meter = size_pixels / size_meters
    elevation_range = np.max(heightmap) - np.min(heightmap)
    return elevation_range * pixels_per_meter * normalize_heightmap(heightmap)


def encode_heightmap(heightmap):
    data = base64.b64encode(heightmap)
    return bytes.decode(data)


HEIGHTMAP_SIZE = 100
MOUNTAIN_CONFIG_FILENAME = 'mountain_config.json'
MOUNTAIN_DATA_FILENAME = 'generated/mountain_data.json'
RAW_DEMS_DIR = 'generated/raw_dems'
DEMS_DIR = 'generated/dems'
HEIGHTMAPS_DIR = 'generated/heightmaps'


def ensure_dirs():
    os.makedirs(RAW_DEMS_DIR, exist_ok=True)
    os.makedirs(DEMS_DIR, exist_ok=True)
    os.makedirs(HEIGHTMAPS_DIR, exist_ok=True)


def get_raw_dem_filename(mountain):
    return os.path.join(RAW_DEMS_DIR, mountain['name'] + '.tif')


def get_dem_filename(mountain):
    return os.path.join(DEMS_DIR, mountain['name'] + '.tif')


def get_heightmap_filename(mountain):
    return os.path.join(HEIGHTMAPS_DIR, mountain['name'] + '.png')


async def main():
    ensure_dirs()

    with open(MOUNTAIN_CONFIG_FILENAME) as file:
        mountains = json.load(file)

    async with aiohttp.ClientSession() as session:
        requests = []
        for mountain in mountains:
            request = fetch_dem(
                session,
                get_raw_dem_filename(mountain),
                mountain['coords'],
                mountain['radius']
            )
            requests.append(request)
        await asyncio.wait(requests)

    for mountain in mountains:
        reproject_dem(get_raw_dem_filename(mountain), get_dem_filename(mountain))
        heightmap = read_dem(get_dem_filename(mountain))
        heightmap = resize_heightmap(heightmap, HEIGHTMAP_SIZE)
        heightmap = rescale_elevations(heightmap, mountain['radius'] * 2)
        mountain['heightmap'] = encode_heightmap(heightmap)
        write_image(heightmap, get_heightmap_filename(mountain))

    with open(MOUNTAIN_DATA_FILENAME, 'w') as file:
        json.dump(mountains, file)


asyncio.run(main())
