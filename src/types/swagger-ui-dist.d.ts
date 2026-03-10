/*
  Swagger UI is loaded dynamically at runtime, so these local declarations
  provide the minimal module surface needed for strict type-checking without
  introducing an additional DefinitelyTyped dependency.
*/
declare module "swagger-ui-dist/swagger-ui-es-bundle" {
  interface SwaggerUiConfig {
    domNode: HTMLElement;
    url: string;
    layout: string;
    deepLinking: boolean;
    docExpansion: string;
    defaultModelsExpandDepth: number;
    showExtensions: boolean;
    showCommonExtensions: boolean;
    presets: unknown[];
    onFailure: () => void;
  }

  interface SwaggerUiInstance {
    destroy?: () => void;
  }

  interface SwaggerUiModule {
    (config: SwaggerUiConfig): SwaggerUiInstance;
    presets: {
      apis: unknown;
    };
  }

  const swaggerUi: SwaggerUiModule;
  export default swaggerUi;
}

declare module "swagger-ui-dist/swagger-ui.css";
