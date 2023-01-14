import os
import json
import requests
import base64
import numpy as np
import geopy
import geopy.distance
import rasterio
from rasterio.crs import CRS
from rasterio.warp import calculate_default_transform, reproject, Resampling
from PIL import Image

import aiohttp
import asyncio


async def fetch_dem(http_session, dst_filename, center, radius):
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
    async with http_session.get(url, params=params) as response:
        with open(dst_filename, 'wb') as file:
            file.write(await response.read())


def reproject_dem(src_filename, dst_filename, dst_crs):
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


def read_dem(dem_filename):
    with rasterio.open(dem_filename) as dem:
        data = dem.read(1)
    return data.astype(np.float32)


def normalize_heightmap(heightmap):
    min_elevation = np.min(heightmap)
    max_elevation = np.max(heightmap)
    return (heightmap - min_elevation) / (max_elevation - min_elevation)


def write_image(image_filename, heightmap):
    heightmap = normalize_heightmap(heightmap)
    heightmap = (heightmap * np.iinfo(np.uint8).max).astype(np.uint8)
    image = Image.fromarray(heightmap)
    image.save(image_filename)


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


size_pixels = 100
dropoff_factor = 0.25

with open('mountains.json') as file:
    mountains = json.load(file)


async def fetch_dems():
    async with aiohttp.ClientSession() as session:
        requests = []
        for mountain in mountains:
            dem_filename = os.path.join('data/dems', mountain['id'] + '.tif')
            requests.append(fetch_dem(session, dem_filename, mountain['coords'], mountain['radius']))
        await asyncio.gather(*requests)


async def main():

    await fetch_dems()
    for mountain in mountains:
        dem_filename = os.path.join('data/dems', mountain['id'] + '.tif')
        mercator_filename = os.path.join('data/mercator_dems', mountain['id'] + '.tif')
        reproject_dem(dem_filename, mercator_filename, CRS.from_epsg(3857))
        heightmap = read_dem(mercator_filename)
        heightmap = resize_heightmap(heightmap, size_pixels)
        heightmap = rescale_elevations(heightmap, mountain['radius'] * 2)
        mountain['heightmap'] = encode_heightmap(heightmap)
        write_image(os.path.join('data/heightmaps', mountain['id'] + '.png'), heightmap)

    with open('../generated/mountains.json', 'w') as file:
        json.dump(mountains, file)

asyncio.run(main())
