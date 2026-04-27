# Te Encontré - Sistema Inteligente de Rescate 🚨

Plataforma integral "Privacy-First" diseñada para agilizar de manera drástica el reencuentro de personas vulnerables (niños, adultos mayores, personas con discapacidades) con sus apoderados a través de escaneos rápidos.

## Características Principales 🌟

1. **Reconocimiento Facial On-Edge:** Integración directa de la cámara del usuario (citizen report) contra modelos entrenados empleando *face-api.js* localmente. La biometría del sujeto se compara mediante vectores faciales cruzados y validados internamente por el backend sin requerir logins.
2. **Escáner de Código QR Universal:** Identificación criptográfica alternativa que puede operarse sin acceso a cámaras avanzadas o bajo baja iluminación.
3. **Escalamiento Automatizado y Doble Alarma:** Retención temporal en hilos de reportes (Fase SOS). Notificación silenciosa en paralelo y escalamiento con temporizador (2 minutos) para activar autoridades como contramedida de respuesta.
4. **Protección Ciega de Identidad (Ley de Protección de Datos):** 
   - El ciudadano *solidario* no se expone explícitamente y nunca ve los nombres reales del niño ni correos o información civil. 
   - A los familiares solo se les muestra como "Apoderado Titular" y "Apoderado Auxiliar".  
5. **Auditoría de Actividad Silenciosa:** Se obtiene y cruza el Timestamp, Metadatos de Dispositivo, Sensor de Geolocalización (Lat/Long) y Protocolo IPv4. 

## Arquitectura de Software 📂

### Frontend (`/frontend-react`) ⚛️
Construido con React 18 en entorno Vite. Integración agresiva de UX con `Tailwind CSS`, estado global con contextos de seguridad de React, enrutamiento semántico, y librerías de manejo QR (Html5Qrcode) e IA.

### Backend (`/backend-java`) ☕
Servicio monolítico robusto implementado en **Java 17 con Spring Boot 3**.
- Despliegue con persistencia transaccional (PostgreSQL / JPA).
- Servicio perimetral de Cloudinary para alojamiento seguro de la malla fotográfica.
- Envío asincrónico de mails en Threads.
- Autenticación criptográfica con JWT (Access Refresh Lifecycle).

## Flujo de Emergencia en Vivo (5 Fases) 🚀
1. **Identificación Inicial:** El usuario halla a la persona errante y accede mediante reconocimiento facial o código QR.
2. **Evidencia Requerida:** La recolección de prueba visual actual es en tiempo real. 
3. **Disparador Secundario (Backend):** El reporte SOS se anida bajo un UUID. 
4. **Seguridad Psicológica Solidaria:** Solicitud opcional de un dato de contacto telefónico del ciudadano (Si omite, el sistema no reenvía ceros falsos; maneja el null en la DB manteniéndolo cubierto).
5. **Rescate Final y Contingencia Institucional 114:** Se muestra el contacto del **Apoderado Titular** anonimizado. Si en dos minutos no contestan, el protocolo lanza los contactos Auxiliares y exhorta a coordinar con la Central de la **Policía P.N.P. o Sistema 114**.

---  
*Sistema diseñado para resguardos vitales comunitarios.*
