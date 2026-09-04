const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console });

for (const file of ['three.min.js', 'raytracer.js', 'material.js', 'light.js', 'shape.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

vm.runInContext('this.exportsForTest = { THREE, Ray, Plane, Sphere, Triangle, DiffuseMaterial, createAreaLight };', context);
const { THREE, Ray, Plane, Sphere, Triangle, DiffuseMaterial, createAreaLight } = context.exportsForTest;
const material = DiffuseMaterial(new THREE.Color(0, 0, 0), new THREE.Color(1, 1, 1));

const sphere = new Sphere(new THREE.Vector3(0, 0, 0), 1, material);
const sphereHit = sphere.intersect(new Ray(new THREE.Vector3(0, 0, 3), new THREE.Vector3(0, 0, -1)), 0.001, Infinity);
assert.ok(sphereHit);
assert.equal(sphereHit.t, 2);
assert.equal(sphere.intersect(new Ray(new THREE.Vector3(0, 0, 3), new THREE.Vector3(0, 1, 0)), 0.001, Infinity), null);

const plane = new Plane(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), material);
const planeHit = plane.intersect(new Ray(new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, -1, 0)), 0.001, Infinity);
assert.ok(planeHit);
assert.equal(planeHit.t, 2);

const triangle = new Triangle(
  new THREE.Vector3(-1, -1, 0),
  new THREE.Vector3(1, -1, 0),
  new THREE.Vector3(0, 1, 0),
  material
);
const triangleHit = triangle.intersect(new Ray(new THREE.Vector3(0, 0, 2), new THREE.Vector3(0, 0, -1)), 0.001, Infinity);
assert.ok(triangleHit);
assert.equal(triangleHit.t, 2);
assert.equal(triangle.intersect(new Ray(new THREE.Vector3(2, 0, 2), new THREE.Vector3(0, 0, -1)), 0.001, Infinity), null);

context.lights = [];
const areaLightIntensity = new THREE.Color(8, 4, 2);
createAreaLight(new THREE.Vector3(0, 2, 0), 2, areaLightIntensity, 2);
assert.equal(context.lights.length, 4);
assert.equal(areaLightIntensity.r, 8);
assert.equal(areaLightIntensity.g, 4);
assert.equal(areaLightIntensity.b, 2);

console.log('Intersection checks passed.');
