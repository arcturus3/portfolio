attribute float opacity;
varying vec3 frag_position;
varying float frag_opacity;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    // gl_PointSize = 1.5;
    frag_position = vec3(position);
    frag_opacity = opacity;
}
