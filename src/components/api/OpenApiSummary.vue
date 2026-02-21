<template>
  <aside class="quick-info" aria-label="OpenAPI summary">
    <h2 class="quick-info__title">OpenAPI Analysis (Current)</h2>
    <ul class="quick-info__list">
      <li>Success JSON includes message + meta.requestId + meta.timestamp</li>
      <li>Error JSON includes error.code + error.message + optional details</li>
      <li>PDF merge success returns binary + X-Operation-Message header</li>
      <li>X-Request-Id is returned on both success and error responses</li>
    </ul>
  </aside>
</template>
