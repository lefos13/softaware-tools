// Why this exists: the portal now has multiple independent flows, so we centralize route matching and navigation.
import { computed, ref } from "vue";
import AdminReportsView from "../views/AdminReportsView.vue";
import DonateView from "../views/DonateView.vue";
import HomeView from "../views/HomeView.vue";
import ImageConvertFlowView from "../views/ImageConvertFlowView.vue";
import ImageFlowView from "../views/ImageFlowView.vue";
import OpenApiView from "../views/OpenApiView.vue";
import PdfFlowView from "../views/PdfFlowView.vue";
import PdfExtractToWordFlowView from "../views/PdfExtractToWordFlowView.vue";
import PdfSplitFlowView from "../views/PdfSplitFlowView.vue";

const routes = [
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
  return routes.find((route) => route.path === normalized) || fallbackRoute;
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

  const currentRoute = computed(() => findRouteByPath(currentPath.value));
  const currentComponent = computed(() => currentRoute.value.component);

  return {
    routes,
    currentPath,
    currentRoute,
    currentComponent,
    navigate,
    dispose: () => window.removeEventListener("popstate", syncFromLocation),
  };
};
