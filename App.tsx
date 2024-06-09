import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Animated, Button, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MqttHelper from './helpers/MqttHelper'; // Import MQTT helper class
import vehicleIcon from './assets/marker_vehicle.png';
import LocationUtils from './helpers/LocationUtils'; // Import LocationUtils class
import { styles } from './helpers/styles'; // Import styles
import * as geolib from 'geolib';

type Coordinate = {
  latitude: number;
  longitude: number;
};

type MqttMessage = {
  payloadString: string;
  topic: string;
};

const initialRegion = {
  latitude: 24.74894444419256,
  longitude: 55.48447756374216,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const App: React.FC = () => {
  let vehicleCoordinates: Coordinate[] = [];
  let currentCoordinate: Coordinate = { latitude: 0, longitude: 0 };
  const [polylineRoute, setPolylineRoute] =  useState<Coordinate[]>([]);
  const [vehicleCoordinatesCount, setVehicleCoordinatesCount] = useState(0);
  const [isVehicleOnMove, setIsVehicleOnMove] = useState(false);
  const mapRef = useRef<MapView>(null);
  const [markerAnimationRotation, setMarkerAnimationRotation] = useState(0);
  const markerAnimationPosition = useRef(new Animated.ValueXY()).current;
  const markerRotation = useRef(new Animated.Value(0)).current;


  const animateMarker = (nextCoordinate: Coordinate, onAnimationComplete: () => void) => {
    setIsVehicleOnMove(true);
    const newCurrentRotation = geolib.getRhumbLineBearing(currentCoordinate,nextCoordinate)
   setMarkerAnimationRotation(newCurrentRotation);

    Animated.parallel([
      Animated.timing(markerAnimationPosition, {
        toValue: { x: nextCoordinate.latitude, y: nextCoordinate.longitude },
        duration: 2000,
        useNativeDriver: false,
      }),
      Animated.timing(markerRotation, {
        toValue: newCurrentRotation,
        duration: 300, // Change the duration as needed
        useNativeDriver: false,
      }),

    ]).start(({ finished }) => {
   
      if (finished) {
        currentCoordinate = nextCoordinate;
        setIsVehicleOnMove(false);
        onAnimationComplete();
      }
    });
  };

  const initiateVehicleMovementIfNot = () => {
    if (vehicleCoordinates.length > 0 && isVehicleOnMove === false) {
      animateToNextCoordinate();
    }
  };

  const resetAnimation = () => {
    setMarkerAnimationRotation(0);
    vehicleCoordinates.length = 0;
    setIsVehicleOnMove(false);

    if (polylineRoute.length > 0) {
      currentCoordinate = polylineRoute[0]
      zoomToLocation(polylineRoute[0]);
      vehicleCoordinates.push(...polylineRoute);
    }
    initiateVehicleMovementIfNot();
  };

  const zoomToLocation = (coordinate: Coordinate) => {
    mapRef.current?.animateToRegion({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: 0,
      longitudeDelta: 0
    });
  };

  const animateToNextCoordinate = () => {
    if (vehicleCoordinates.length > 0) {
      const newCoordinate = vehicleCoordinates.shift();

      setVehicleCoordinatesCount(vehicleCoordinates.length);
      if (newCoordinate) {
        animateMarker(newCoordinate, () => {
          animateToNextCoordinate();
        });
      }
    }
  };

  useEffect(() => {
    const mqttHelper = new MqttHelper('ws://dtdev.fleetman.ae:1883/ws', 'clientId');

    mqttHelper.connect(
      () => {
        console.log('Connection Lost');
      }
    )
      .then(() => {
        console.log('MQTT Connected');
        mqttHelper.subscribe('Vehicle/Locations', (message: MqttMessage) => {
          console.log('Received MQTT Message (Vehicle/Locations/214342)');//214342 is vehicle unique id
          try {
            const locationData = JSON.parse(message.payloadString);
            const coordinate: Coordinate = {
              latitude: locationData.latitude,
              longitude: locationData.longitude
            };

            vehicleCoordinates.push(coordinate);
            setVehicleCoordinatesCount(vehicleCoordinates.length);
            setPolylineRoute((prevRoute) => [...prevRoute, coordinate]);
            initiateVehicleMovementIfNot();
          } catch (error) {
            console.warn('Error parsing payload for Vehicle/Locations:', error);
          }
        });

        mqttHelper.subscribe('Vehicle/BulkLocations/214342', (message: MqttMessage) => { //214342 is vehicle unique id
          console.log('Received MQTT Message (Vehicle/BulkLocations):', message);

          try {
            const bulkLocationData = JSON.parse(message.payloadString);
            if (Array.isArray(bulkLocationData)) {
              const coordinates: Coordinate[] = bulkLocationData.map((location: any) => ({
                latitude: location.latitude,
                longitude: location.longitude
              }));
              vehicleCoordinates.push(...coordinates);
              setPolylineRoute((prevRoute) => [...prevRoute, ...coordinates]);
              setVehicleCoordinatesCount(vehicleCoordinates.length);
              initiateVehicleMovementIfNot();
            } else {
              console.warn('Invalid payload format for Vehicle/BulkLocations:', message.payloadString);
            }
          } catch (error) {
            console.error('Error parsing payload for Vehicle/BulkLocations:', error);
          }
        });
      })
      .catch((error) => {
        console.error('MQTT Connection Error:', error);
        mqttHelper.connect();
      });

    return () => {
      MqttHelper.disconnect();
    };
  }, []);

  useEffect(() => {
    initiateVehicleMovementIfNot();
  }, []);

  const navigateToVehicle = () => {
  console.log( currentCoordinate);
    if (currentCoordinate != null) {
      zoomToLocation(currentCoordinate);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        initialRegion={initialRegion}
        style={styles.map}>
        <Polyline
          coordinates={polylineRoute}
          strokeWidth={10}
          strokeColor="green"
        />
        <Marker.Animated
          coordinate={{
            latitude: markerAnimationPosition.x,
            longitude: markerAnimationPosition.y,
          }}
          title="Vehicle"
          description="marker vehicle"
          flat= {true}
          anchor={{ x: 0.5, y: 0.5 }}>

            <Animated.View style={{ transform: [{ rotate: markerRotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }] }}>
            <Animated.Image
              source={vehicleIcon}
              style={{
                width: 40,
                height: 40,
                resizeMode: 'contain',
                overflow: 'visible'
              }}
            />
          </Animated.View>

        </Marker.Animated>
      </MapView>
      <View style={styles.buttonContainer}>
        <View style={{ marginBottom: 10 }}>
          <Button title="Replay" onPress={resetAnimation} />
        </View>
        <View style={{ marginTop: 10 }}>
          <Button title="Show Vehicle" onPress={navigateToVehicle} />
        </View>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          route size: {vehicleCoordinatesCount} IsVehicleOnMove: {isVehicleOnMove ? 'Yes' : 'No'}  Rotation: {markerAnimationRotation}
        </Text>
      </View>
    </View>
  );
};

export default App;

