import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from './App';
import MqttHelper from './helpers/MqttHelper';

jest.mock('./helpers/MqttHelper'); // Mock the MqttHelper

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders map and initial UI elements', () => {
    const { getByText, getByTestId } = render(<App />);
    
    // Check if the map is rendered
    expect(getByTestId('map')).toBeTruthy();
    
    // Check if buttons are rendered
    expect(getByText('Replay')).toBeTruthy();
    expect(getByText('Show Vehicle')).toBeTruthy();
    
    // Check if info text is rendered
    expect(getByText(/route size:/)).toBeTruthy();
  });

  test('vehicle moves to new location on MQTT message', async () => {
    const { getByTestId } = render(<App />);
    
    // Simulate receiving an MQTT message with a new location
    const newLocation = {
      latitude: 12.9716,
      longitude: 77.5946,
    };
    
    // Mock MQTT message arrival
    const message = {
      payloadString: JSON.stringify(newLocation),
      topic: 'Vehicle/Locations/214342', //214342 is vehicle unique id
    };
    MqttHelper.prototype.subscribe.mockImplementation((topic, callback) => {
      if (topic === 'Vehicle/Locations/214342') {////214342 is vehicle unique id
        callback(message);
      }
    });

    // Wait for the marker to move to the new location
    await waitFor(() => {
      const marker = getByTestId('vehicle-marker');
      expect(marker.props.coordinate).toEqual(newLocation);
    });
  });
});
