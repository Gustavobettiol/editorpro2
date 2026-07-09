# AGENTS.md - GUSTY Premium Anonymous Chat

## Descripción del Proyecto
Plataforma de chat anónimo y público con salas temáticas (General, Posadas, Misiones, Random, VIP), video chat grupal P2P y reproductor de radio integrado. Diseño premium inspirado en estéticas oscuras con detalles en oro y rojo.

---

## Stack Tecnológico
- **Backend**: Node.js + Express + Socket.io
- **Frontend**: Vanilla JavaScript + CSS3 + HTML5
- **WebRTC**: Simple-Peer (para abstracción de RTCPeerConnection)
- **Signaling**: Socket.io
- **Estilos**: Tema oscuro personalizado (Pure Taboo inspired)

---

## Estructura de Archivos
```
/
├── server.js              # Servidor Express + Socket.io (Signaling & Static)
├── package.json           # Dependencias y scripts
├── public/
│   ├── index.html         # Estructura de la SPA
│   ├── style.css          # Estilos premium (Oro/Rojo/Oscuro)
│   └── script.js          # Lógica de chat y WebRTC grupal
└── AGENTS.md              # Documentación del proyecto
```

---

## Funcionamiento del Sistema

### 1. Salas Temáticas
El servidor maneja salas mediante `socket.join(room)`. Al entrar a una sala, el usuario recibe la lista de otros participantes y establece conexiones P2P con cada uno de ellos para el video chat grupal.

### 2. Video Chat (WebRTC)
Utiliza la librería `Simple-Peer`.
- Cuando un usuario entra a una sala, el servidor le envía los IDs de los usuarios ya presentes (`room-users`).
- El nuevo usuario inicia una oferta (`SimplePeer({initiator: true})`) para cada usuario existente.
- La señalización se realiza a través de eventos de socket `signal`.
- Cada conexión exitosa genera un stream de video que se inyecta en el `video-grid`.

### 3. Chat de Texto
Chat en tiempo real por sala. Los mensajes se envían a todos los miembros de la sala actual. Se ha implementado seguridad contra XSS utilizando `textContent` al renderizar mensajes.

### 4. Reproductor General
Un reproductor de audio integrado en la barra lateral para acompañar la experiencia de navegación en las salas de Misiones.

---

## Mantenimiento y Seguridad

- **XSS**: No utilizar `innerHTML` para mostrar contenido generado por el usuario.
- **Media Devices**: Manejo de errores integrado para casos donde la cámara o el micrófono no estén disponibles.
- **Salas**: Las salas son estáticas por ahora (`General`, `Posadas`, `Misiones`, `Random`, `VIP`).

---

## Criterios de Éxito
- Conexión fluida entre múltiples usuarios en la misma sala.
- Cambio de sala funcional (limpiando peers anteriores).
- Interfaz responsiva y visualmente atractiva en modo oscuro.
