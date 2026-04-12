# Tasks: Expansión fullscreen de cámara + scroll lock en modales

## Phase 1: Scroll Lock en Modales (Home.jsx)
- [ ] 1.1 Agregar `useEffect` en Home.jsx que detecte cuando `showModal`, `showScannerModal` o `showReconocimientoModal` cambian a `true`
- [ ] 1.2 En el efecto: set `document.body.style.overflow = 'hidden'` cuando cualquier modal está abierto
- [ ] 1.3 Agregar cleanup al efecto: restaurar `document.body.style.overflow = ''` cuando los modales se cierran
- [ ] 1.4 Verificar que el scroll lock funciona al abrir/cerrar cada modal individualmente

## Phase 2: Expansión Fullscreen - BuscarRostro.jsx
- [ ] 2.1 Modificar el contenedor de cámara (línea ~226): agregar clases condicionales que cambien `aspect-video` a `h-full` o `flex-1` cuando `cameraOn === true`
- [ ] 2.2 Envolver el contenedor de cámara y los botones en un flex container que ocupe todo el espacio disponible
- [ ] 2.3 Reposicionar los botones (líneas ~289-317): moverlos dentro del contenedor de cámara como overlay flotante
- [ ] 2.4 Agregar clases Tailwind para el overlay: `absolute bottom-4 left-0 right-0 flex justify-center gap-3 z-30`
- [ ] 2.5 Agregar transiciones suaves con `transition-all duration-300` en el contenedor

## Phase 3: Expansión Fullscreen - RegistrarRostro.jsx
- [ ] 3.1 Modificar el contenedor de cámara (línea ~261): cambiar de `aspect-video` a clases condicionales que expandan cuando `cameraOn === true`
- [ ] 3.2 Reposicionar los botones (líneas ~299-327): moverlos como overlay flotante dentro del contenedor de cámara
- [ ] 3.3 Agregar z-index y posicionamiento absolute para que los botones floten sobre el video
- [ ] 3.4 Agregar transiciones con `transition-all duration-300`

## Phase 4: Expansión Fullscreen - FormularioGafete.jsx
- [ ] 4.1 Localizar el contenedor de cámara (línea ~371): es un div con `aspect-video` dentro de la sección de escaneo facial
- [ ] 4.2 Modificar el contenedor: agregar clases condicionales que expandan a fullscreen cuando `cameraOn === true`
- [ ] 4.3 Reposicionar los botones (líneas ~410-438): moverlos como overlay flotante dentro del contenedor
- [ ] 4.4 Considerar que este componente está dentro de un modal con `max-h-[80vh]`, la expansión debe respetar ese límite
- [ ] 4.5 Agregar transiciones suaves

## Phase 5: Testing y Verificación
- [ ] 5.1 Verificar que el scroll lock funciona correctamente en Home.jsx para los 3 modales
- [ ] 5.2 Verificar que al cerrar cualquier modal se restaura el scroll del body
- [ ] 5.3 Probar expansión de cámara en BuscarRostro.jsx: click "Encender cámara" debe expandir el contenedor
- [ ] 5.4 Verificar que los botones "Escanear rostro"/"Apagar" se ven como overlay en la parte inferior
- [ ] 5.5 Probar expansión en RegistrarRostro.jsx: misma verificación que 5.3-5.4
- [ ] 5.6 Probar expansión en FormularioGafete.jsx: verificar que respeta el límite del modal
- [ ] 5.7 Verificar que al apagar la cámara, el contenedor vuelve a su tamaño original en los 3 componentes
- [ ] 5.8 Testear responsive: la expansión debe funcionar en mobile y desktop
