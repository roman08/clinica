# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Proyecto de práctica: landing page de una sola página para "Nácar · Clínica Dental", una clínica **ficticia**. El estilo visual se inspira en alalbadermatologia.com (paleta verde azulado y coral, estética clínica y luminosa, degradado melocotón antes del footer), pero no se copian su marca, sus textos ni sus fotos. El toque propio viene del proyecto hermano `../practica-landing`: el hero 3D con Three.js. El objetivo de conversión es pedir cita por teléfono o email; no hay formulario.

Todos los datos de contacto son falsos a propósito: `+34 900 000 000`, `hola@nacar.example` (dominio reservado `.example`) y "Calle del Ejemplo". El profesional ("Dr. Daniel Ríos") es inventado, y la página lo aclara. Las personas de las fotos no tienen relación con la clínica. No pongas un nombre real a nadie de las fotos ni uses fotos con nombres o logotipos visibles.

## Restricciones

- HTML, CSS y JavaScript puros. Sin build step, sin bundlers, sin frameworks y sin CDN.
- La única dependencia es Three.js 0.186.1, en `vendor/` (`three.module.js` y `three.core.js`, sin minificar). No añadas addons de Three.js: importan `'three'` y necesitarían un import map.
- Sin fuentes externas: se usa el system font stack (`--fuente`).
- Es una sola página, y se navega con anclas.
- Comenta el JS solo donde la lógica no sea obvia.

## Desarrollo

```bash
node serve.js
```

Sirve la página en http://localhost:8000, con gzip y sin dependencias. En esta máquina no hay Python.

Con doble clic (`file://`) no carga el módulo del hero y se ve la foto de `.hero__fallback`. El navegador integrado de Claude abre los `file://` como una instantánea sin CSS ni JS, así que para probar hay que usar `serve.js`. Si el panel del navegador está oculto, `requestAnimationFrame` casi no avanza: para comprobar el bucle 3D, cuenta dibujados entre capturas de pantalla.

No hay linter ni tests configurados.

## Arquitectura

- **Carga**: `index.html` carga `styles.css`, `script.js` (clásico, `defer`) y `hero3d.js` (`type="module"`). Los scripts son independientes entre sí.
- **Secciones**: `.site-header` (fija) → `.hero#inicio` → `<main id="main">` con `#nosotros`, `.values`, `#tratamientos`, `#equipo` (`.section--teal`) y `#contacto` → footer con degradado melocotón.
- **CSS**:
  - Mobile-first, con media queries al final: 600 px (grids a 2 columnas), 768 px (footer), 900 px (hero y equipo a 2 columnas, menú horizontal) y 1100 px (valores y tratamientos a 4 columnas).
  - Clases tipo BEM.
- **Paleta**: los tokens y sus ratios de contraste están comentados en `:root`.
  - El verde azulado de la referencia (`--color-primario`, `#357e83`) llega justo a 4,70:1 con texto blanco. No lo aclares.
  - El coral (`--color-acento`) solo va de fondo con texto oscuro (`--color-texto`) y nunca como texto sobre claro. Para texto con tono coral se usa `--color-acento-oscuro`.
  - El anillo de foco usa `--color-foco`: vale `--color-primario-oscuro` por defecto y blanco en `.section--teal`, porque el coral solo da 1,87:1 sobre el verde azulado. Cualquier zona oscura nueva debe redefinirlo.
- **Hero 3D (`hero3d.js`)**:
  - Es una mejora progresiva sobre `.hero__fallback`. El canvas solo se ve cuando `[data-hero3d]` recibe `.is-3d-ready`, tras el primer fotograma, y la clase se quita si se pierde el contexto WebGL.
  - El bucle solo corre con el hero en pantalla, la pestaña visible y sin movimiento reducido; si no, se dibuja un único fotograma fijo.
  - La muela es una `SphereGeometry` deformada en `createCrownGeometry()` (cúspides, surco y cuello) más dos raíces de `CylinderGeometry`, con `MeshPhysicalMaterial` (clearcoat y sheen).
  - Los reflejos salen de `createEnvironment()`: una sala virtual con paneles de luz en los colores de la marca, procesada con `PMREMGenerator`, sin HDR.
  - El panel con forma de burbuja (`.hero__visual`) da el fondo verde azulado que hace resaltar el esmalte blanco.
  - Los avisos `X4122` del compilador de sombreadores en consola vienen del driver gráfico de Windows y son inofensivos.
- **Menú móvil**: solo se pliega cuando JS añade `.has-js` y quita `hidden` al `.nav-toggle`. Se cierra con Escape, al pulsar un enlace o al pasar a escritorio. Las secciones llevan `scroll-margin-top` por la cabecera fija.
- **`data-scroll`**: los CTA "Pedir cita" hacen scroll suave a `#contacto` y dan el foco al enlace de teléfono.
- **`data-reveal`**: fade-in con `IntersectionObserver`, una sola vez. Sin JS o con movimiento reducido, el contenido se ve siempre.
- **Movimiento**: cualquier animación con desplazamiento, escala o giro va dentro de `@media (prefers-reduced-motion: no-preference)`.
- **Fotos**: van en `img/` como `{uso}-{nombre}-{800|1600}.webp`, con créditos en `img/CREDITS.md`. Cada `<img>` lleva `width` y `height` reales y un `alt` descriptivo; las decorativas llevan `alt=""`.
