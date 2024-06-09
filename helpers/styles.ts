import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 5,
    display: 'none'
  },
  infoText: {
    fontSize: 16,
    color: 'white',
  },
});
