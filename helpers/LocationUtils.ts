type Coordinate = {
  latitude: number;
  longitude: number;
};
// LocationUtils.ts


export default class LocationUtils {
  static calculateBearing(startCoord: Coordinate, endCoord: Coordinate): number {
    const lat = Math.abs(startCoord.latitude - endCoord.latitude);
    const lng = Math.abs(startCoord.longitude - endCoord.longitude);
  
    let angle: number;
  
    if (startCoord.latitude < endCoord.latitude && startCoord.longitude < endCoord.longitude)
      angle = Math.atan(lng / lat) * (180 / Math.PI);
    else if (startCoord.latitude >= endCoord.latitude && startCoord.longitude < endCoord.longitude)
      angle = (90 - Math.atan(lng / lat) * (180 / Math.PI)) + 90;
    else if (startCoord.latitude >= endCoord.latitude && startCoord.longitude >= endCoord.longitude)
      angle = Math.atan(lng / lat) * (180 / Math.PI) + 180;
    else if (startCoord.latitude < endCoord.latitude && startCoord.longitude >= endCoord.longitude)
      angle = (90 - Math.atan(lng / lat) * (180 / Math.PI)) + 270;
    else
      angle = -1;
  
    return angle;
  }
  static calculateHeading (cord1:Coordinate, cord2:Coordinate):number {
    if (cord2) {
      const {latitude: lat1, longitude: lng1} = cord1;
      const {latitude: lat2, longitude: lng2} = cord2;
      const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
      const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
      const θ = Math.atan2(y, x);
      const brng = ((θ * 180) / Math.PI + 360) % 360;
      return brng;
    }
    return 0;
  };
  static toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  static toDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  }

  
}
