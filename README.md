# ZenTask — Productividad Inteligente 🚀

ZenTask es una aplicación web progresiva (PWA) enfocada en la productividad personal. Su objetivo es centralizar la gestión de tu tiempo, hábitos diarios y objetivos a largo plazo, bajo una interfaz moderna, limpia y escalable.

---

## 🌟 Características Principales

### 1. Gestión de Tareas (To-Do List)
Crea, edita y organiza tareas puntuales.
- **Prioridades:** Clasifica tus tareas en Alta (Rosa), Media (Violeta) o Baja (Verde).
- **Control de Tiempo:** Asigna fechas y horas límite.
- **Alertas Visuales:** Las tareas que ya pasaron su fecha límite muestran una etiqueta `VENCIDA` en color rojo para mantenerte alerta.
- **Completado Animado:** Al marcar una tarea como lista en el panel principal, una sutil animación te recompensa visualmente antes de desaparecer de las tareas pendientes.

### 2. Rastreo de Rutinas (Habit Tracker)
Asegúrate de cumplir tus hábitos diarios de forma visual.
- **Días de la semana:** Configura qué días específicos debes cumplir una rutina.
- **Day-Track:** Cada rutina tiene una barra de 7 segmentos (L-M-X-J-V-S-D) que se ilumina si cumpliste la rutina en el día correspondiente.
- **Marcado Rápido:** Con un solo clic desde el Dashboard puedes registrar que cumpliste tu hábito en el día de hoy.

### 3. Seguimiento de Metas (Goals)
Visualiza el progreso de tus objetivos a largo plazo.
- **Progreso Medible:** Define una meta numérica (ej. "Ir al gym 100 veces" o "Leer 10 libros").
- **Barra de Progreso:** Una barra de porcentaje en tonos coral/naranja se llena dinámicamente a medida que avanzas.
- **Suma de Progreso:** Añade o resta puntos a tu meta fácilmente desde la interfaz para mantener tu progreso actualizado al instante.

### 4. Experiencia Offline-First (PWA)
ZenTask funciona como una aplicación nativa en tu celular o computadora.
- **Instalable:** Puedes añadirla a la pantalla de inicio de tu celular. Al abrirla, no habrá barra de direcciones del navegador.
- **Soporte sin conexión:** Si te quedas sin internet, la aplicación seguirá abriendo instantáneamente y mostrará tus tareas guardadas localmente.
- **Cola de Sincronización:** ¿Marcaste una tarea como completada estando en la calle sin señal? ZenTask lo recuerda y lo enviará al servidor tan pronto vuelvas a tener conexión. Un pequeño indicador en la esquina superior derecha te mostrará si estás "Sin conexión" o si hay "X tareas pendientes" de sincronizar.

### 5. Sincronización en Tiempo Real
Gracias al uso de WebSockets, si tienes ZenTask abierto en tu computadora y en tu celular al mismo tiempo, marcar una tarea como completada en un dispositivo la actualizará instantáneamente en el otro, sin necesidad de recargar la página.

---

## 🎨 Sistema de Diseño (Design Tokens)

ZenTask está construido sobre un sistema de diseño propio basado en CSS plano (`tokens.css` y `blueprints.css`). Esto permite un control absoluto sobre el aspecto visual sin depender de librerías externas pesadas.

- **Paleta de Colores:** Violeta Profundo (Principal), Teal (Rutinas/Éxito) y Coral (Metas/Avisos).
- **Modo Oscuro/Claro:** La aplicación cambia de paleta completa con un solo botón en la barra lateral, cuidando los contrastes de lectura en ambos modos.
- **Glassmorphism:** Componentes con fondos semitransparentes y desenfoques (blur) para una sensación moderna y de profundidad.

---

## 🛠️ Cómo iniciar el proyecto localmente

Si necesitas abrir el proyecto para desarrollo o para demostración:

1. Abre **PowerShell** en tu computadora.
2. Ve a la carpeta del proyecto.
3. Ejecuta el script de inicio mágico:
   ```bash
   .\iniciar_zentask.ps1
   ```
4. Este script levantará la base de datos (Django), la web (Vite) y creará un enlace seguro temporal (`https://....lhr.life`) que podrás abrir en tu celular para ver la app en vivo.

---

*Desarrollado como un espacio personal de enfoque y productividad.*
