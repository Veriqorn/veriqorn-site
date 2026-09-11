# Управление ID автотестов

Veriqorn позволяет зарезервировать стабильный числовой ID до коммита нового автотеста. ID выдаётся внутри проекта последовательно: `1`, `2`, `3` и далее. Это Allure ID теста, а не UUID результата Allure.

## Зарезервируйте ID

До создания теста выберите стабильную идентичность из пути теста в репозитории и его названия. Резервировать ID может owner или maintainer проекта:

```bash
curl --fail-with-body -X POST "$VERIQORN_URL/api/v1/projects/default/test-case-ids/reservations" \
  -H "Authorization: Bearer $VERIQORN_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "testIdentity": "e2e/checkout.spec.ts::guest can pay by card",
    "testName": "Guest can pay by card"
  }'
```

В ответе числовой ID находится в `data.testCaseId`. Храните тот же `testIdentity` рядом с кодом теста: перенос файла сам по себе не должен незаметно менять его.

## Добавьте ID в тест

Фреймворк должен передать в Allure оба label. Конкретный декоратор или helper зависит от фреймворка.

```ts
allure.label("allure.id", "42")
allure.label("veriqorn.test.identity", "e2e/checkout.spec.ts::guest can pay by card")
```

Не генерируйте номера локально и не используйте ID другого теста. На каждый новый тест резервируйте отдельный ID.

## Что происходит при импорте

При загрузке результатов Veriqorn подтверждает резерв с совпадающей идентичностью. Если числовой ID никогда не резервировался, первый присланный тест автоматически закрепляет его за собой. Старые тесты без `veriqorn.test.identity` поддерживаются: идентичность берётся из Allure `historyId`, затем `fullName`, затем названия теста.

Если другой тест использует уже занятый ID, его результат всё равно будет загружен. В карточке появится **Duplicate test ID**, а в реестре будет сохранена конфликтующая идентичность. Так не теряются результаты и видно, что нужно исправить.

## Проверьте резервы и конфликты

Можно получить весь реестр или отфильтровать записи со статусом `reserved`, `claimed` либо `conflicted`:

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $VERIQORN_TOKEN" \
  "$VERIQORN_URL/api/v1/projects/default/test-case-ids?status=conflicted"
```
