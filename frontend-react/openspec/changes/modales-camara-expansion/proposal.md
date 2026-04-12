# Proposal: Scroll Lock y Expansión Fullscreen de Cámara en Modales

## Intent
Mejorar la UX de los modales de cámara en Home.jsx implementando:
1. **Scroll lock**: Bloquear el scroll del body cuando cualquier modal está abierto
2. **Expansión de cámara**: Expandir el área de cámara a casi fullscreen dentro del modal cuando se activa, manteniendo los controles accesibles

## Scope

### In Scope
- Scroll lock en `Home.jsx` para los 3 modales (registro, reconocimiento facial, scanner QR)
- Expansión de cámara en `BuscarRostro.jsx` al encender la cámara
- Expansión de cámara en `RegistrarRostro.jsx` al encender la cámara
- Expansión de cámara en `FormularioGafete.jsx` al encender la cámara
- Overlay de botones en posición inferior cuando la cámara está expandida
- Transiciones suaves entre estados

### Out of Scope
- Cambios en la lógica de detección facial
- Cambios en el backend
- Nuevos modales adicionales
- Modo fullscreen nativo de browser (Fullscreen API)

## Approach

### Scroll Lock
Usar `useEffect` en `Home.jsx` para aplicar `overflow: hidden` al `document.body` cuando cualquiera de los 3 modales esté abierto (`showModal || showReconocimientoModal || showScannerModal`).

**Implementación**:
```javascript
useEffect(() => {
  const anyModalOpen = showModal || showReconocimientoModal || showScannerModal;
  if (anyModalOpen) {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }
}, [showModal, showReconocimientoModal, showScannerModal]);
```

### Expansión de Cámara
Usar estado local `cameraExpanded` (o reutilizar `cameraOn`) para controlar la expansión del contenedor de video.

**Estrategia CSS**:
- Contenedor de cámara: transición suave entre `aspect-video` (normal) y `h-[85vh]` (expandido)
- Usar `transition-all duration-500 ease-out` para animación fluida
- Contenedor padre del modal debe permitir scroll interno si es necesario

**Posicionamiento de botones**:
- En estado expandido: botones como `fixed` o `absolute` posicionados en `bottom-4` dentro del contenedor
- Usar z-index para que floten sobre el video

**Estructura sugerida**:
```jsx
<div className={`relative transition-all duration-500 ease-out ${cameraOn ? 'h-[85vh]' : 'aspect-video'}`}>
  <video ... />
  <canvas ... />
  
  {/* Controles overlay */}
  <div className={`flex gap-3 transition-all duration-300 ${cameraOn ? 'absolute bottom-4 left-1/2 -translate-x-1/2 z-10' : 'relative mt-4'}`}>
    <button>Capturar</button>
    <button>Cancelar</button>
  </div>
</div>
```

## Affected Areas

| Archivo | Impacto | Cambios |
|---------|---------|---------|
| `Home.jsx` | Modified | Agregar useEffect para scroll lock del body |
| `BuscarRostro.jsx` | Modified | Expansión dinámica del contenedor de cámara, overlay de botones |
| `RegistrarRostro.jsx` | Modified | Expansión dinámica del contenedor de cámara, overlay de botones |
| `FormularioGafete.jsx` | Modified | Expansión dinámica del contenedor de cámara dentro del formulario |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Z-index conflicts con elementos existentes | Low | Verificar que `z-50` del modal no interfiera con controles de cámara |
| Transición brusca en dispositivos móviles | Medium | Usar `will-change: transform` y `transform` en lugar de width/height cuando sea posible |
| Botones overlay bloquean detección de rostro | Low | Botones posicionados en área inferior 15%, afuera del área típica de detección facial |
| Scroll lock no se remueve si hay error | Low | Usar cleanup de useEffect y manejar errores en cierre de modal |

## Rollback Plan

1. Revertir los cambios en los 4 archivos modificados
2. Alternativa: comentar el useEffect de scroll lock y restaurar clases CSS originales de los contenedores de cámara

## Dependencies

- Ninguna dependencia externa nueva
- Requiere mantener compatibilidad con Tailwind CSS existente

## Success Criteria

- [ ] Al abrir cualquier modal, el body no permite scroll
- [ ] Al cerrar el modal, el scroll vuelve a funcionar normalmente
- [ ] En BuscarRostro.jsx: al hacer click en "Encender cámara", el área de video se expande al 85% del viewport
- [ ] En RegistrarRostro.jsx: expansión similar al activar cámara
- [ ] En FormularioGafete.jsx: expansión dentro del contexto del modal de registro
- [ ] Los botones "Capturar rostro/Cancelar" son visibles y accesibles en la parte inferior cuando la cámara está expandida
- [ ] Al apagar la cámara, el contenedor vuelve a su tamaño original suavemente
- [ ] Las transiciones son suaves (300-500ms) sin saltos visuales
