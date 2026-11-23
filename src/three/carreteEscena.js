/**
 * Adaptador fino de Three.js del carrete 3D: único módulo que importa `three`.
 * Se carga con `import()` dinámico desde `useCarrete`. Toda la matemática vive
 * en `src/utils/carrete3d.js`; acá solo se aplica el "cuadro" ya calculado.
 */
import {
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from "three"
import { CAMERA, CORNER_RADIUS, PLANE, SHADE, BEND_MAX, coverUv, deformPlane } from "../utils/carrete3d.js"

/** Color del panel Eva (#100E0C) en espacio lineal, mientras no hay textura. */
const PANEL_LINEAR = [0.0052, 0.0044, 0.0037]

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAGMENT_SHADER = `
uniform sampler2D uMap;
uniform float uHasMap;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;
uniform vec2 uSize;
uniform float uRadius;
uniform float uBendMix;
uniform float uShade;
uniform vec3 uPanel;
varying vec2 vUv;

float sdRoundRect(vec2 p, vec2 h, float r) {
  vec2 q = abs(p) - h + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 p = (vUv - 0.5) * uSize;
  float d = sdRoundRect(p, uSize * 0.5, uRadius);
  float aa = max(fwidth(d), 1e-5);
  float alpha = clamp(0.5 - d / aa, 0.0, 1.0);
  if (alpha < 0.002) discard;

  vec3 tex = texture2D(uMap, vUv * uUvScale + uUvOffset).rgb;
  vec3 color = mix(uPanel, tex, uHasMap);
  float u = vUv.x * 2.0 - 1.0;
  color *= 1.0 - uShade * u * u * uBendMix;

  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
  gl_FragColor.rgb *= gl_FragColor.a;
}
`

/**
 * @param {{ container: HTMLElement, projects: Array<{ image: string, imageWidth: number, imageHeight: number }>, onContextLost?: () => void, onNeedRender?: () => void }} options
 */
export function createCarreteEscena({ container, projects, onContextLost, onNeedRender }) {
  const canvas = document.createElement("canvas")
  canvas.setAttribute("aria-hidden", "true")
  container.appendChild(canvas)

  // El contexto se crea acá (no dentro de three) para fallar en silencio, sin ruido en la consola.
  const attributes = { alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: "default" }
  const context = canvas.getContext("webgl2", attributes)
  if (!context) {
    canvas.remove()
    throw new Error("WebGL 2 no disponible")
  }
  let renderer
  try {
    renderer = new WebGLRenderer({ canvas, context, ...attributes })
  } catch (error) {
    canvas.remove()
    throw error
  }
  renderer.setClearColor(0x000000, 0)

  const handleContextLost = (event) => {
    event.preventDefault()
    onContextLost?.()
  }
  canvas.addEventListener("webglcontextlost", handleContextLost)

  const scene = new Scene()
  const camera = new PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far)
  camera.position.set(0, 0, CAMERA.z)

  const geometry = new PlaneGeometry(PLANE.width, PLANE.height, PLANE.segmentsX, PLANE.segmentsY)
  const position = geometry.attributes.position
  const flat = new Float32Array(position.array)
  const planeAspect = PLANE.width / PLANE.height
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  const loader = new TextureLoader()

  let disposed = false
  let lastBend = NaN
  let lastRipple = NaN
  let lastTime = NaN

  const cards = projects.map((project) => {
    const uv = coverUv(project.imageWidth / project.imageHeight, planeAspect)
    const material = new ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      premultipliedAlpha: true,
      depthWrite: true,
      uniforms: {
        uMap: { value: null },
        uHasMap: { value: 0 },
        uUvScale: { value: uv.scale },
        uUvOffset: { value: uv.offset },
        uSize: { value: [PLANE.width, PLANE.height] },
        uRadius: { value: CORNER_RADIUS },
        uBendMix: { value: 1 },
        uShade: { value: SHADE },
        uPanel: { value: PANEL_LINEAR },
      },
    })
    const mesh = new Mesh(geometry, material)
    mesh.rotation.order = "YXZ"
    mesh.frustumCulled = false
    mesh.visible = false
    scene.add(mesh)

    const card = { mesh, material, texture: null }
    loader.load(project.image, (texture) => {
      if (disposed) {
        texture.dispose()
        return
      }
      texture.colorSpace = SRGBColorSpace
      texture.generateMipmaps = true
      texture.minFilter = LinearMipmapLinearFilter
      texture.magFilter = LinearFilter
      texture.anisotropy = anisotropy
      card.texture = texture
      material.uniforms.uMap.value = texture
      material.uniforms.uHasMap.value = 1
      onNeedRender?.()
    })
    return card
  })

  return {
    canvas,

    /** @param {number} width @param {number} height @param {number} dpr */
    setSize(width, height, dpr) {
      renderer.setPixelRatio(Math.min(dpr || 1, 2))
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    },

    /** Dibuja un cuadro calculado por `reelFrame`. */
    render(frame) {
      if (disposed) return
      if (frame.bend !== lastBend || frame.rippleAmp !== lastRipple || (frame.rippleAmp > 0 && frame.time !== lastTime)) {
        deformPlane(flat, position.array, { bend: frame.bend, time: frame.time, rippleAmp: frame.rippleAmp, height: PLANE.height })
        position.needsUpdate = true
        lastBend = frame.bend
        lastRipple = frame.rippleAmp
        lastTime = frame.time
      }
      const bendMix = frame.bend / BEND_MAX
      for (const data of frame.cards) {
        const { mesh, material } = cards[data.index]
        mesh.visible = data.visible
        mesh.position.set(data.x, data.y, data.z)
        mesh.rotation.set(data.rotX, data.rotY, 0)
        mesh.scale.setScalar(data.scale)
        material.uniforms.uBendMix.value = bendMix
      }
      renderer.render(scene, camera)
    },

    dispose() {
      if (disposed) return
      disposed = true
      canvas.removeEventListener("webglcontextlost", handleContextLost)
      geometry.dispose()
      for (const { material, texture } of cards) {
        material.dispose()
        if (texture) texture.dispose()
      }
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
