uniform vec3 diffuse;
uniform vec3 background;
uniform vec3 light;
varying vec3 modelPosition;
varying vec3 viewPosition;
varying vec3 viewNormal;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float get_opacity(vec3 position) {
    const float threshold = 0.5;
    float radius = clamp(length(vec2(position.x, position.z)), 0.0, 1.0);
    if (radius <= threshold)
    return 1.0;
    else
    return 1.0 - smoothstep(threshold, 1.0, radius) + mix(-2.5/255.0, 2.5/255.0, rand(vec2(position.x, position.z))); // dithering
}

void main() {
    // vec3 light_ray = normalize(light - modelPosition);
    vec3 light_pos = normalize(vec3(1, 1, 1));
    float intensity = max(0.0, dot(viewNormal, light_pos));
    float half_lambert_intensity = 0.1 * pow(0.5 * intensity + 0.5, 2.0);
    vec3 lit_diffuse = 0.1 * intensity * diffuse;
    // vec3 lit_diffuse = half_lambert_intensity * diffuse;
    vec3 color = mix(background, lit_diffuse, get_opacity(modelPosition));
    gl_FragColor = vec4(color, 1.0);
}
