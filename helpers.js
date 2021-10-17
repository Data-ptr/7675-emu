function cleanHexify(value, size) {
  if(undefined == size) {
    size = 2;
  }

  let padding;

  for(let i = 1; i < size;i++) {
    padding += "0"
  }

  return (padding + value.toString(16)).slice(-size).toUpperCase();
}

function checkBytes(bytes, size) {
  if(2 != size && 4 != size) {
    size = 2;
  }

  let error = 0;

  if (undefined == bytes) {
    error = 1;
    console.error("Trying to set to undefined!", new Error().stack);
  }

  if (isNaN(bytes)) {
    error = 1;
    console.error("Trying to set to NaN!", new Error().stack);
  }

  if (bytes < 0) {
    error = 1;
    console.error("Trying to set to negative!", new Error().stack);
  }

  if (bytes > (4 == size ? 0xFFFF : 0xFF)) {
    error = 1;
    console.error("Trying to set to overflow! > 0x" + (4 == size ? 0xFFFF : 0xFF).toString(16)), new Error().stack;
  }

  if(error) {
    console.warn("Offending value: 0x", bytes.toString(16))
    clearInterval(stepInterval);
    clearInterval(clockUpdateInterval);
  }

  return error;
}
