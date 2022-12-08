import os
import requests
import geopy
import geopy.distance

MAPS_API_KEY = os.environ['MAPS_API_KEY']
OPEN_TOPOGRAPHY_API_KEY = os.environ['OPEN_TOPOGRAPHY_API_KEY']

center = geopy.Point(latitude=45.278056, longitude=-111.450278)
radius = geopy.distance.distance(meters=1000)

north_bound = radius.destination(center, bearing=0).latitude
east_bound = radius.destination(center, bearing=90).longitude
south_bound = radius.destination(center, bearing=180).latitude
west_bound = radius.destination(center, bearing=270).longitude

response = requests.get(
    'https://portal.opentopography.org/API/globaldem',
    {
        'demtype': 'COP30',
        'north': north_bound,
        'east': east_bound,
        'south': south_bound,
        'west': west_bound,
        'outputFormat': 'GTiff',
        'API_Key': OPEN_TOPOGRAPHY_API_KEY
    }
)

print(response)
