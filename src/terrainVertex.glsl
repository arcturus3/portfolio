varying vec3 modelPosition;
varying vec3 viewPosition;
varying vec3 viewNormal;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    modelPosition = vec3(modelMatrix * vec4(position, 1.));
    viewPosition = vec3(modelViewMatrix * vec4(position, 1.));
    viewNormal = normalMatrix * normal;
}
