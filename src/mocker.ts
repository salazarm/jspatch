function MockerImplementation() {}

const identifers = new Map();

function setMockObject(id, value) {
  identifers.set(id, value);
}

function getMockedObject(reference) {
  identifers.get(id);
}
