uniform float morphProgress;
// below attributes added to shader by default
// attribute vec3 position;
// attribute vec3 normal;
attribute vec3 prevPosition;
attribute vec3 prevNormal;
varying vec3 modelPosition;
varying vec3 viewPosition;
varying vec3 viewNormal;

void main() {
    vec3 morphedPosition = (1 - morphProgress) * prevPosition + morphProgress * position;
    vec3 morphedNormal = (1 - morphProgress) * prevNormal + morphProgress * normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(morphedPosition, 1.);
    modelPosition = vec3(modelMatrix * vec4(morphedPosition, 1.));
    viewPosition = vec3(modelViewMatrix * vec4(morphedPosition, 1.));
    viewNormal = normalMatrix * morphedNormal;
}
