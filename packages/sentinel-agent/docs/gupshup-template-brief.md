# Template WhatsApp — `harvverse_sentinel_alert`

**Para:** Jesús Cueva. 
**De:** Sheylla Cortez.

## Qué es esto

Alerta por WhatsApp al caficultor cuando el backend detecta un escenario (caída de NDVI, estrés hídrico, etc.).  
No es un chat libre: Meta exige un **template aprobado** con texto base y **7 huecos** que nosotros rellenamos en cada envío.

- Las líneas fijas las defines tú al registrar el template.
- El mensaje principal (puede variar y pulirse con IA) va en el hueco **`{{7}}`**.

Doc técnica del equipo (Postman, env, API): [04-gupshup-y-webhook.md](./04-gupshup-y-webhook.md).

---

## Datos del template

| Campo | Valor |
|-------|--------|
| Nombre sugerido | `harvverse_sentinel_alert` |
| Categoría sugerida | **UTILITY** (alerta al agricultor) |
| Idioma | Español |
| Variables en el cuerpo | **7**, orden fijo `{{1}}` … `{{7}}` |

## Texto para registrar en Gupshup

```
Hola {{1}}, alerta Sentinel en {{2}} (lote {{3}}).

Risk Score: {{4}}/100
Proyección cosecha: {{5}}
Detalle del lote: {{6}}

{{7}}
```

| Slot | Contenido | Ejemplo |
|------|-----------|---------|
| {{1}} | Nombre del caficultor | Javier Puerto |
| {{2}} | Nombre de la finca | Finca Test |
| {{3}} | Código del lote | lotetest |
| {{4}} | Risk score | 90 |
| {{5}} | Rango de cosecha | 14.0-21.0 qq |
| {{6}} | URL pública del lote | https://harvverse.com/lot/lotetest |
| {{7}} | Mensaje completo de la alerta | Ver abajo |


**{{7}}** es el texto más largo y cambiante. Revisar límites de Meta; si rechazan por tamaño, avisarnos.

- Mirar si acepta emojis, porque a veces la ai los pone.

## Ejemplos para muestra de aprobación Meta

**{{7}} corto:**

```
Hola Javier, detectamos una caída de NDVI en tu lote lotetest. Risk Score 90. Revisa el enlace del lote y cuéntanos si ves hojas marchitas, manchas o daño en el fruto.
```

**{{7}} más largo (orientativo):**

```
Javier, en Finca Test (lote lotetest) vimos una caída importante de NDVI. Tu Risk Score es 90/100 y la proyección sigue en 14.0-21.0 qq. Revisa el cafetal pronto. Abre el enlace del lote; si hay síntomas en campo, respóndenos — no asumimos la causa solo por el índice.
```

## Reglas de contenido ({{7}})

- Español LATAM, tono cercano y profesional.
- Alerta informativa, no spam.
- No diagnosticar causa única solo por NDVI.
- No recomendar fungicidas por nombre.
- Sí invitar a revisar el lote y observar síntomas en campo.

Un solo template sirve para todos los tipos de alerta; solo cambian los valores de los 7 huecos.

## Qué necesitamos cuando esté aprobado

- [ ] **Template ID** — el identificador que Gupshup asigna al template ya aprobado (no el nombre `harvverse_sentinel_alert`, sino el ID numérico o UUID que usa la API al enviar).
- [ ] Confirmación de que el template tiene **7 variables** en el **mismo orden** que la tabla de arriba.
- [ ] **Nombre exacto** del template en la consola, si en Gupshup quedó distinto de `harvverse_sentinel_alert`.

### Credenciales de envío (pasarlas a Sheylla por canal seguro)

Son los datos que usa nuestro servicio para llamar a `https://api.gupshup.io/wa/api/v1/template/msg` y mandar el WhatsApp. Sin esto no podemos enviar en producción.

| Qué nos pasas | Para qué sirve | Ejemplo / formato |
|---------------|----------------|-------------------|
| **API Key** | Autenticación en el header `apikey` de cada envío. Suele estar en Gupshup → app → API Keys / Partner dashboard. | Una cadena larga (no compartir en chat público; usar 1Password, correo cifrado, etc.). |
| **Número origen (source)** | El WhatsApp Business **desde el que sale** el mensaje: el número de la app vinculada en Gupshup. Va en el campo `source` del POST. | E.164 sin espacios, ej. `50499990000` o con prefijo según indique Gupshup. |
| **Nombre de la app (`src.name`)** | Identificador de la aplicación en Gupshup; va en el campo `src.name` del mismo POST. No es el nombre del template. | El valor exacto que muestra la consola de la app (ej. `HarvverseWhatsApp`). |

Opcional pero útil:

- **App ID** de Gupshup (por si luego usamos la Partner API en lugar de la WA API v1).
- Confirmación de si el entorno es **sandbox** o **producción** y si el número origen ya puede escribir a números de prueba reales.

**Teléfono destino:** no hace falta que nos lo des tú; lo tomamos del caficultor en Harvverse en cada alerta.

Puedes mandarlo en un mensaje así (valores inventados):

```
Template ID: 1234567890abcdef
API Key: xxxxx
Número origen (source): 50499990000
Nombre app (src.name): HarvverseWhatsApp
```

Referencia API Gupshup: [Send msg With Template ID](https://partner-docs.gupshup.io/reference/post_partner-app-appid-template-msg)
