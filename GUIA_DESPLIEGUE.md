# Guía de Despliegue de Aetheris

Esta guía te llevará paso a paso para lanzar tu aplicación a la nube de Google.

## Paso 1: Subir código a GitHub
Como no tienes el comando `gcloud` instalado, usaremos la interfaz web, lo cual es muy visual y seguro.

1.  Ve a [Crear Nuevo Repositorio en GitHub](https://github.com/new).
2.  Nombre del repositorio: `aetheris`
3.  Público o Privado: **Privado** (recomendado).
4.  No marques ninguna casilla de inicialización (ni README, ni .gitignore).
5.  Dale al botón verde **"Create repository"**.
6.  Copia la URL que aparece (ej: `https://github.com/TU_USUARIO/aetheris.git`).

## Paso 2: Conectar tu código local (Terminal)
Una vez tengas la URL, vuelve a hablar conmigo (Antigravity) y dame esa URL. Yo ejecutaré el comando para subir todo.

## Paso 3: Configurar Google Cloud (Web)
1.  Entra a [Google Cloud Console](https://console.cloud.google.com/).
2.  Arriba a la izquierda, selecciona o crea un proyecto nuevo (ej: `aetheris-ai`).
3.  En la barra de búsqueda superior, escribe **"Cloud Build"** y selecciona "Cloud Build API".
    *   Dale a **Habilitar**.
4.  Busca **"Cloud Run"** y selecciona "Cloud Run API".
    *   Dale a **Habilitar**.
5.  Busca **"Vertex AI"** y selecciona "Vertex AI API".
    *   Dale a **Habilitar**.

## Paso 4: Crear el "Puente" (Disparador)
1.  Ve a [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers).
2.  Clic en **"Crear activador"** (o "Create Trigger").
3.  **Fuente**: Elige tu repositorio de GitHub `aetheris`. Te pedirá autorización.
4.  **Configuración**: Deja todo como está (Autodetectar configuración). Google encontrará automáticamente el archivo `cloudbuild.yaml` que ya creé.
5.  Clic en **Crear**.

## Paso 5: ¡Despegue!
1.  En la lista de activadores, dale al botón **"Ejecutar"** a la derecha.
2.  Ve a la pestaña **Historial** para ver el progreso.
3.  Cuando termine (verded), ve a [Cloud Run](https://console.cloud.google.com/run).
4.  Verás tu servicio `smart-web-atlas-backend`. ¡Dale clic y copia la URL!

---
**Nota**: Cuando tengas la URL de Cloud Run, avísame para actualizar la extensión.
