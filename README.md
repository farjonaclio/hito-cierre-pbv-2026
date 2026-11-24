# Hagamos que siga pasando · Hitos de cierre PBV 2026

App web para la actividad de los hitos de cierre del Plan Buen Vecino (IKEA Colombia · CliO).

- **Celulares:** cada persona escanea el QR y responde en 3 pasos: 🏆 Logros 2026, 🔧 Lo que nos costó y 🌱 Sueños 2027, además de una carita para calificar su experiencia.
- **Proyector:** desde el computador se proyecta el **tendedero en vivo** (las tarjetas colgadas por tema) y el **tablero en vivo** (cifras, gráficos y palabras más repetidas).
- **Respaldo:** las respuestas se guardan en una hoja de Google mediante Apps Script.

## Enlaces (reemplaza `USUARIO` por la cuenta de GitHub)

| Uso | Enlace |
|---|---|
| Inicio (elegir tienda) | `https://USUARIO.github.io/hito-cierre-pbv-2026/` |
| Participar · Envigado | `…/?tienda=envigado` |
| Instrucciones (proyector) · Envigado | `…/?tienda=envigado&vista=instrucciones` |
| Tendedero · Envigado | `…/?tienda=envigado&vista=tendedero` |
| Tablero · Envigado | `…/?tienda=envigado&vista=tablero` |
| Tablero · tres tiendas | `…/?tienda=todas&vista=tablero` |

Lo mismo para `cali` y `bogota`. El QR del tendedero y del tablero lleva a la página de participación de esa tienda.

## Puesta en marcha

1. **Hoja y Apps Script.** Crea una hoja de Google, abre *Extensiones › Apps Script*, pega `apps-script-Code.gs` y ejecuta `setup` una vez.
2. **Desplegar.** *Implementar › Nueva implementación › Aplicación web*. Ejecutar como: **yo**. Quién tiene acceso: **cualquier persona**. Copia la URL que termina en `/exec`.
3. **Conectar.** Pega esa URL en `API_URL` de `config.js`.
4. **Publicar.** En GitHub: *Settings › Pages › Deploy from a branch › main / root*.

Sin `API_URL` la app funciona en **modo demostración**: guarda las respuestas solo en el navegador y sirve para ensayar.

## Moderación

En la hoja `Respuestas`, escribe **NO** en la columna `visible` para retirar una respuesta del tendedero y del tablero.

## Datos personales (Ley 1581 de 2012)

- El nombre es **opcional**. Quien prefiera puede participar de forma **anónima** y en pantalla solo se ve su rol.
- Si alguien escribe su nombre, debe marcar la **autorización**; sin ella, el nombre no se guarda.
- El texto de autorización está en `config.js` (`AUTORIZACION`) y **debe validarse con el área legal** antes del evento.
- La hoja de respuestas debe compartirse solo con el equipo responsable. Define cuánto tiempo se conservan los nombres y elimínalos cuando ya no se necesiten.
- No se recogen otros datos personales (cédula, teléfono ni correo).

## Créditos

Generador de QR: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT), cargado desde jsDelivr.
