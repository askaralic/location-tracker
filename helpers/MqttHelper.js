import { Client, Message } from 'react-native-paho-mqtt';

class MqttHelper {
  static disconnect() {
    // Disconnect the MQTT client
    if (this.client && this.client.isConnected()) {
      this.client.disconnect();
      console.log('Disconnected from MQTT broker');
    } else {
      console.log('Client is not connected');
    }
  }

  constructor(uri, clientId) {
    this.client = new Client({ uri, clientId, storage: this.getStorage() });
    this.isConnected = false;
    this.storage = {};
    this.subscriptions = {};
  }

  getStorage() {
    return {
      setItem: (key, item) => {
        this.storage[key] = item;
      },
      getItem: (key) => this.storage[key],
      removeItem: (key) => {
        delete this.storage[key];
      },
    };
  }

  connect(onConnectionLost) {
    return new Promise((resolve, reject) => {
      this.client.on('connectionLost', () => {
        if (onConnectionLost) {
          onConnectionLost(); // Call the callback function without any parameters
        }
        this.isConnected = false;
      });

      this.client.on('messageReceived', (message) => {
        const topic = message.destinationName;
        if (this.subscriptions[topic]) {
          this.subscriptions[topic](message);
        }
      });

      this.client.connect()
        .then(() => {
          console.log('Connected');
          this.isConnected = true;
          resolve();
        })
        .catch((responseObject) => {
          if (responseObject.errorCode !== 0) {
            console.log('Connection failed: ' + responseObject.errorMessage);
          }
          this.isConnected = false;
          reject(responseObject);
        });
    });
  }

  subscribe(topic, onMessageReceived) {
    if (!this.isConnected) {
      console.error('Cannot subscribe, client not connected');
      return;
    }

    this.client.subscribe(topic)
      .then(() => {
        this.subscriptions[topic] = onMessageReceived;
        console.log(`Subscribed to topic: ${topic}`);
      })
      .catch((error) => {
        console.error(`Subscription to topic ${topic} failed:`, error);
      });
  }

  sendMessage(destination, message) {
    if (!this.isConnected) {
      console.error('Cannot send message, client not connected');
      return;
    }
    const msg = new Message(message);
    msg.destinationName = destination;
    this.client.send(msg);
  }
}

export default MqttHelper;
