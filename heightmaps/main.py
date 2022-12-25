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
import easing_functions


def get_dem(dem_filename, center, radius):
    distance = geopy.distance.distance(meters=radius)
    response = requests.get(
        'https://portal.opentopography.org/API/globaldem',
        {
            'API_Key': os.environ['OPEN_TOPOGRAPHY_API_KEY'],
            'demtype': 'COP30',
            'outputFormat': 'GTiff',
            'north': distance.destination(center, bearing=0).latitude,
            'south': distance.destination(center, bearing=180).latitude,
            'east': distance.destination(center, bearing=90).longitude,
            'west': distance.destination(center, bearing=270).longitude,
        }
    )
    with open(dem_filename, 'wb') as file:
        file.write(response.content)


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


def dropoff(radius, factor, x):
    dist = factor * radius
    inner_radius = radius - dist
    ease = easing_functions.CubicEaseInOut(start=1, end=0, duration=dist)
    clamped_x = np.clip(x, inner_radius, radius)
    return ease(clamped_x - inner_radius)


def _apply_dropoff(heightmap, dropoff_factor):
    size_pixels = heightmap.shape[0]
    center = (size_pixels - 1) / 2
    result_heightmap = np.zeros_like(heightmap)
    for y in range(size_pixels):
        for x in range(size_pixels):
            dist = np.linalg.norm([x - center, y - center])
            result_heightmap[y][x] = heightmap[y][x] * dropoff(center, dropoff_factor, dist)
    return result_heightmap


def apply_dropoff(heightmap, dropoff_factor):
    size_pixels = heightmap.shape[0]
    center = (size_pixels - 1) / 2
    result_heightmap = np.zeros_like(heightmap)
    for y in range(size_pixels):
        for x in range(size_pixels):
            dist = np.linalg.norm([x - center, y - center])
            if dist <= 50:
                factor = 1
            elif dist <= 100:
                factor = 2 - dist / 50
            else:
                factor = 0
            result_heightmap[y][x] = heightmap[y][x] * factor
    return result_heightmap



def encode_heightmap(heightmap):
    data = base64.b64encode(heightmap)
    return bytes.decode(data)


size_pixels = 100
dropoff_factor = 0.25

with open('mountains.json') as file:
    mountains = json.load(file)

for mountain in mountains:
    dem_filename = os.path.join('data/dems', mountain['id'] + '.tif')
    mercator_filename = os.path.join('data/mercator_dems', mountain['id'] + '.tif')

    # get_dem(dem_filename, mountain['coords'], 1000)
    reproject_dem(dem_filename, mercator_filename, CRS.from_epsg(3857))

    heightmap = read_dem(mercator_filename)
    write_image(os.path.join('data/heightmaps1', mountain['id'] + '.png'), heightmap)
    heightmap = resize_heightmap(heightmap, size_pixels)
    write_image(os.path.join('data/heightmaps2', mountain['id'] + '.png'), heightmap)
    heightmap = rescale_elevations(heightmap, mountain['radius'] * 2)
    write_image(os.path.join('data/heightmaps3', mountain['id'] + '.png'), heightmap)
    # heightmap = apply_dropoff(heightmap, dropoff_factor)
    write_image(os.path.join('data/heightmaps4', mountain['id'] + '.png'), heightmap)
    mountain['heightmap'] = encode_heightmap(heightmap)

with open('../mountains.json', 'w') as file:
    json.dump(mountains, file)
