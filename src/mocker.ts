/**
 * MockerImplementation, we will use toString to get the raw text and insert this at spot where we want to mock
 *
 * Generic mock
 */
function MockerImplementation() {}

const identifers = new Map();

function setMockObject(id, value) {
  identifers.set(id, value);
}

function getMockedObject(reference) {
  identifers.get(id);
}
