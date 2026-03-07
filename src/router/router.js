/*
  Router supports both static and parameterized flow paths so JSON mini tools
  can reuse one workspace route while preserving lightweight navigation state.
*/
import { computed, ref } from "vue";
import AdminReportsView from "../views/AdminReportsView.vue";
import BooksGreekEditorFlowView from "../views/BooksGreekEditorFlowView.vue";
import BooksServicesView from "../views/BooksServicesView.vue";
import DonateView from "../views/DonateView.vue";
import HomeView from "../views/HomeView.vue";
import ImageConvertFlowView from "../views/ImageConvertFlowView.vue";
import ImageFlowView from "../views/ImageFlowView.vue";
import ImageServicesView from "../views/ImageServicesView.vue";
import JsonServicesView from "../views/JsonServicesView.vue";
import JsonToolWorkspaceView from "../views/JsonToolWorkspaceView.vue";
import OpenApiView from "../views/OpenApiView.vue";
import PdfFlowView from "../views/PdfFlowView.vue";
import PdfFromImagesFlowView from "../views/PdfFromImagesFlowView.vue";
import PdfPageNumbersFlowView from "../views/PdfPageNumbersFlowView.vue";
import PdfEditPagesFlowView from "../views/PdfEditPagesFlowView.vue";
import PdfExtractTextFlowView from "../views/PdfExtractTextFlowView.vue";
import PdfExtractToWordFlowView from "../views/PdfExtractToWordFlowView.vue";
import PdfServicesView from "../views/PdfServicesView.vue";
import PdfSplitFlowView from "../views/PdfSplitFlowView.vue";
import PdfWatermarkFlowView from "../views/PdfWatermarkFlowView.vue";
import { JSON_TOOL_BY_ID } from "../services/jsonTools/registry";

const jsonServicesEnabled = import.meta.env.VITE_ENABLE_JSON_SERVICES === "true";
const booksServicesEnabled = import.meta.env.VITE_ENABLE_BOOKS_SERVICES === "true";

const staticRoutes = [
  {
    path: "/",
    name: "home",
    label: "Home",
    component: HomeView,
  },
  {
    path: "/flows/pdf-services",
    name: "pdf-services",
    label: "PDF Services",
    component: PdfServicesView,
  },
  {
    path: "/flows/pdf",
    name: "pdf",
    label: "PDF Merge",
    component: PdfFlowView,
  },
  {
    path: "/flows/pdf-split",
    name: "pdf-split",
    label: "PDF Split",
    component: PdfSplitFlowView,
  },
  {
    path: "/flows/pdf-extract-to-word",
    name: "pdf-extract-to-word",
    label: "PDF to Word",
    component: PdfExtractToWordFlowView,
  },
  {
    path: "/flows/pdf-watermark",
    name: "pdf-watermark",
    label: "PDF Watermark",
    component: PdfWatermarkFlowView,
  },
  {
    path: "/flows/pdf-page-numbers",
    name: "pdf-page-numbers",
    label: "PDF Page Numbers",
    component: PdfPageNumbersFlowView,
  },
  {
    path: "/flows/pdf-edit-pages",
    name: "pdf-edit-pages",
    label: "PDF Edit Pages",
    component: PdfEditPagesFlowView,
  },
  {
    path: "/flows/pdf-extract-text",
    name: "pdf-extract-text",
    label: "PDF Extract Text",
    component: PdfExtractTextFlowView,
  },
  {
    path: "/flows/pdf-from-images",
    name: "pdf-from-images",
    label: "Images to PDF",
    component: PdfFromImagesFlowView,
  },
  ...(booksServicesEnabled
    ? [
        {
          path: "/flows/books-services",
          name: "books-services",
          label: "Books Services",
          component: BooksServicesView,
        },
        {
          path: "/flows/books-greek-editor",
          name: "books-greek-editor",
          label: "Greek Literature Editor",
          component: BooksGreekEditorFlowView,
        },
      ]
    : []),
  {
    path: "/flows/image-services",
    name: "image-services",
    label: "Image Services",
    component: ImageServicesView,
  },
  {
    path: "/flows/image",
    name: "image",
    label: "Image Compression",
    component: ImageFlowView,
  },
  {
    path: "/flows/image-convert",
    name: "image-convert",
    label: "Image Convert / Background removal",
    component: ImageConvertFlowView,
  },
  {
    path: "/contract/openapi",
    name: "contract",
    label: "API Contract",
    component: OpenApiView,
  },
  {
    path: "/admin/reports",
    name: "admin-reports",
    label: "Admin Reports",
    component: AdminReportsView,
  },
  {
    path: "/donate",
    name: "donate",
    label: "Donate",
    component: DonateView,
  },
];

const dynamicRoutes = jsonServicesEnabled
  ? [
      {
        path: "/flows/json",
        name: "json-services",
        label: "JSON Services",
        component: JsonServicesView,
      },
      {
        path: "/flows/json/:toolId",
        name: "json-tool",
        label: "JSON Tool",
        component: JsonToolWorkspaceView,
        matcher: (path) => {
          const match = path.match(/^\/flows\/json\/([^/]+)$/);
          if (!match) {
            return null;
          }

          const toolId = decodeURIComponent(match[1]);
          if (!JSON_TOOL_BY_ID[toolId]) {
            return null;
          }

          return { toolId };
        },
      },
    ]
  : [];

const routes = [...staticRoutes, ...dynamicRoutes];

const fallbackRoute = routes[0];

const normalizePath = (value) => {
  if (!value) {
    return "/";
  }

  const path = value.startsWith("/") ? value : `/${value}`;
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }

  return path;
};

const findRouteByPath = (path) => {
  const normalized = normalizePath(path);

  const exactMatch = routes.find((route) => route.path === normalized);
  if (exactMatch) {
    return {
      route: exactMatch,
      params: {},
    };
  }

  const dynamicMatch = dynamicRoutes.find((route) => route.matcher?.(normalized));
  if (dynamicMatch) {
    return {
      route: dynamicMatch,
      params: dynamicMatch.matcher(normalized) || {},
    };
  }

  return {
    route: fallbackRoute,
    params: {},
  };
};

export const createPortalRouter = () => {
  const currentPath = ref(normalizePath(window.location.pathname));

  const syncFromLocation = () => {
    currentPath.value = normalizePath(window.location.pathname);
  };

  const navigate = (path) => {
    const normalized = normalizePath(path);
    if (normalized === currentPath.value) {
      return;
    }

    window.history.pushState({}, "", normalized);
    currentPath.value = normalized;
  };

  window.addEventListener("popstate", syncFromLocation);

  const currentRouteMeta = computed(() => findRouteByPath(currentPath.value));
  const currentRoute = computed(() => currentRouteMeta.value.route);
  const currentRouteParams = computed(() => currentRouteMeta.value.params);
  const currentComponent = computed(() => currentRoute.value.component);

  return {
    routes,
    currentPath,
    currentRoute,
    currentRouteParams,
    currentComponent,
    navigate,
    dispose: () => window.removeEventListener("popstate", syncFromLocation),
  };
};
