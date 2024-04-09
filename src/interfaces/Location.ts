interface coordinates {
  lat: number;
  lng: number;
}

interface locationInput {
  topRight: coordinates;
  bottomLeft: coordinates;
}

export {locationInput, coordinates};
