/*
  These vendor modules are used through stable runtime APIs in the JSON tools,
  so local declarations unblock strict migration without pulling the entire repo
  back behind broad any-based suppressions.
*/
declare module "js-yaml";
declare module "papaparse";
