# Nácar · Clínica Dental

Landing page de práctica para una clínica dental **ficticia**. El estilo es clínico y luminoso, con una paleta verde azulado y coral, y el hero tiene una muela en 3D hecha con [Three.js](https://threejs.org) (MIT). Está hecha con HTML, CSS y JavaScript puros, sin build step. Three.js es la única dependencia y va incluida en `vendor/`.

## Cómo abrirla

Con [Node.js](https://nodejs.org) instalado:

```bash
node serve.js
```

Y abre http://localhost:8000. `serve.js` no tiene dependencias.

También puedes abrir `index.html` con doble clic. Todo funciona igual, salvo el hero: los navegadores no ejecutan módulos JavaScript desde `file://`, así que se ve una foto en lugar de la muela 3D.

## Archivos

- `index.html`: cabecera, hero, nosotros, valores, tratamientos, equipo, contacto y footer.
- `styles.css`: estilos mobile-first con variables CSS.
- `script.js`: menú móvil, cabecera al hacer scroll, scroll suave y animaciones de entrada.
- `hero3d.js`: escena 3D de la muela.
- `serve.js`: servidor estático mínimo para desarrollo.
- `vendor/`: Three.js 0.186.1 y su licencia.
- `img/`: fotos en WebP, en dos tamaños. Los créditos están en `img/CREDITS.md`.

La clínica, el doctor, la dirección, el teléfono y el email son inventados.
