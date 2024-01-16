uniform vec3 diffuse;
varying vec3 frag_position;
varying float frag_opacity;

void main() {
    gl_FragColor = vec4(diffuse, frag_opacity);
}
