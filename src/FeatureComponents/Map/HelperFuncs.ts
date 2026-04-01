// Utility function to create radar beam
const createRadarBeam = (
  center: number[],
  radius: number,
  startAngle: number,
  sweepAngle: number,
  numPoints = 10,
) => {
  const coordinates = [center]; // Start with center point
  const startRadians = (startAngle * Math.PI) / 180;
  const sweepRadians = (sweepAngle * Math.PI) / 180;
  const latitude = center[1];
  const adjustedRadiusX = radius / Math.cos((latitude * Math.PI) / 180);

  for (let i = 0; i <= numPoints; i++) {
    const angle = startRadians + (i * sweepRadians) / numPoints;
    const x = center[0] + adjustedRadiusX * Math.cos(angle);
    const y = center[1] + radius * Math.sin(angle);
    coordinates.push([x, y]);
  }

  coordinates.push(center); // Close the polygon
  console.log({coordinates})
  return {
    type: 'Polygon',
    coordinates: [coordinates], // GeoJSON format
  };
};

const newCreateRadarBeam = (
  center: number[],
  radius: number,
  startAngle: number,
  sweepAngle: number,
  numPoints = 10,
) => {
  const coordinates = [center]; // Start with center point
  const startRadians = (startAngle * Math.PI) / 180;
  const sweepRadians = (sweepAngle * Math.PI) / 180;
  const latitude = center[1];
  const adjustedRadiusX = radius / Math.cos((latitude * Math.PI) / 180);

  for (let i = 0; i <= numPoints; i++) {
    const angle = startRadians + (i * sweepRadians) / numPoints;
    const x = center[0] + adjustedRadiusX * Math.cos(angle);
    const y = center[1] + radius * Math.sin(angle);
    coordinates.push([x, y]);
  }

  coordinates.push(center); // Close the polygon

  // Validate coordinates structure
  if (!coordinates || coordinates.length < 3) {
    console.warn('Invalid radar beam coordinates:', coordinates);
    return null;
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
  };
};

// Utility function to create static circle border
const createStaticCircle = (
  center: number[],
  radius: number,
  numPoints = 64,
) => {
  const coordinates = [];
  const latitude = center[1];
  const adjustedRadiusX = radius / Math.cos((latitude * Math.PI) / 180);

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i * 2 * Math.PI) / numPoints;
    const x = center[0] + adjustedRadiusX * Math.cos(angle);
    const y = center[1] + radius * Math.sin(angle);
    coordinates.push([x, y]);
  }

  coordinates.push(coordinates[0]); // Close the circle
  return {
    type: 'Polygon',
    coordinates: [coordinates], // GeoJSON format
  };
};
export {createStaticCircle, createRadarBeam, newCreateRadarBeam};
