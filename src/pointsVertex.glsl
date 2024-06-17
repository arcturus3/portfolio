uniform float morphInfluence;
attribute vec3 initialPosition;
attribute float initialOpacity;
attribute float opacity;
varying vec3 frag_position;
varying float frag_opacity;

void main() {
    vec3 morphedPosition = (1. - morphInfluence) * initialPosition + morphInfluence * position;
    float morphedOpacity = (1. - morphInfluence) * initialOpacity + morphInfluence * opacity;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(morphedPosition, 1.0);
    gl_PointSize = 1.;
    frag_position = vec3(morphedPosition);
    frag_opacity = morphedOpacity;
}
