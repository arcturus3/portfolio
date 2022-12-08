import os
import json
import requests
import numpy as np
import geopy
import geopy.distance
import rasterio
from rasterio.crs import CRS
from rasterio.warp import calculate_default_transform, reproject, Resampling
from PIL import Image


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


def convert_dem_to_image(dem_filename, image_filename):
    with rasterio.open(dem_filename) as src:
        data = src.read(1)
        min_elevation = np.min(data)
        max_elevation = np.max(data)
        normalized = (data - min_elevation) / (max_elevation - min_elevation)
        discretized = (normalized * np.iinfo(np.uint16).max).astype(np.uint16)
        image = Image.fromarray(discretized)
        image.save(image_filename)


with open('../config.json') as file:
    mountains = json.load(file)

for mountain in mountains:
    dem_filename = os.path.join('data/dems', mountain['id'] + '.tif')
    mercator_filename = os.path.join('data/mercator_dems', mountain['id'] + '.tif')
    heightmap_filename = os.path.join('data/heightmaps', mountain['id'] + '.png')

    get_dem(dem_filename, mountain['coords'], 1000)
    reproject_dem(dem_filename, mercator_filename, CRS.from_epsg(3857))
    convert_dem_to_image(mercator_filename, heightmap_filename)
