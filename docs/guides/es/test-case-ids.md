# Gestionar IDs de pruebas automatizadas

Veriqorn puede reservar un ID numérico estable antes de confirmar una nueva prueba automatizada. El ID se entrega por proyecto en secuencia: `1`, `2`, `3`, etc. Es el ID de Allure de la prueba, no el UUID de un resultado de Allure.

## Reservar un ID

Antes de crear una prueba, elija una identidad estable basada en la ruta relativa del repositorio y el título de la prueba. Un maintainer u owner del proyecto puede reservar un ID:

```bash
curl --fail-with-body -X POST "$VERIQORN_URL/api/v1/projects/default/test-case-ids/reservations" \
  -H "Authorization: Bearer $VERIQORN_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "testIdentity": "e2e/checkout.spec.ts::guest can pay by card",
    "testName": "Guest can pay by card"
  }'
```

La respuesta contiene el valor numérico en `data.testCaseId`. Mantenga el mismo `testIdentity` junto al código de la prueba.

## Añadirlo a la prueba

El framework debe enviar ambas etiquetas en el resultado de Allure. El decorador o helper concreto depende del framework.

```ts
allure.label("allure.id", "42")
allure.label("veriqorn.test.identity", "e2e/checkout.spec.ts::guest can pay by card")
```

No genere números localmente ni reutilice el ID de otra prueba.

## Importación y conflictos

Al llegar los resultados, Veriqorn confirma una reserva coincidente. Si un ID numérico nunca fue reservado, la primera prueba importada lo reclama automáticamente. Las suites existentes sin `veriqorn.test.identity` siguen siendo compatibles.

Si otra prueba usa un ID ocupado, Veriqorn conserva el resultado y muestra **Duplicate test ID**. El registro conserva la identidad en conflicto para que pueda corregirse.

## Revisar el registro

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $VERIQORN_TOKEN" \
  "$VERIQORN_URL/api/v1/projects/default/test-case-ids?status=conflicted"
```
