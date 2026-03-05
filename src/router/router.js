/*
  Router supports both static and parameterized flow paths so JSON mini tools
  can reuse one workspace route while preserving lightweight navigation state.
*/
import { computed, ref } from "vue";
import AdminReportsView from "../views/AdminReportsView.vue";
import DonateView from "../views/DonateView.vue";
import HomeView from "../views/HomeView.vue";
import ImageConvertFlowView from "../views/ImageConvertFlowView.vue";
import ImageFlowView from "../views/ImageFlowView.vue";
import JsonServicesView from "../views/JsonServicesView.vue";
import JsonToolWorkspaceView from "../views/JsonToolWorkspaceView.vue";
import OpenApiView from "../views/OpenApiView.vue";
import PdfFlowView from "../views/PdfFlowView.vue";
import PdfExtractToWordFlowView from "../views/PdfExtractToWordFlowView.vue";
import PdfSplitFlowView from "../views/PdfSplitFlowView.vue";
import { JSON_TOOL_BY_ID } from "../services/jsonTools/registry";

const jsonServicesEnabled = import.meta.env.VITE_ENABLE_JSON_SERVICES === "true";

const staticRoutes = [
  {
    path: "/",
    name: "home",
    label: "Home",
    component: HomeView,
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
