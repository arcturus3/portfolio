uniform float morphInfluence;
// below attributes added to shader by default
// attribute vec3 position;
// attribute vec3 normal;
attribute vec3 initialPosition;
attribute vec3 initialNormal;
varying vec3 modelPosition;
varying vec3 viewPosition;
varying vec3 viewNormal;

void main() {
    vec3 morphedPosition = (1. - morphInfluence) * initialPosition + morphInfluence * position;
    vec3 morphedNormal = (1. - morphInfluence) * initialNormal + morphInfluence * normal; // slerp instead
    gl_Position = projectionMatrix * modelViewMatrix * vec4(morphedPosition, 1.);
    modelPosition = vec3(modelMatrix * vec4(morphedPosition, 1.));
    viewPosition = vec3(modelViewMatrix * vec4(morphedPosition, 1.));
    viewNormal = normalMatrix * morphedNormal;
}
