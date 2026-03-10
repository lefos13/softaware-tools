/*
  A shared portal dictionary keeps route labels, guided tool copy, and the
  header language toggle in one place so the interface can switch languages
  without duplicating page logic across the app.
*/
import { inject, ref, watch } from "vue";
import { booksGreekEditorMessages } from "./booksGreekEditorMessages";
import type { LocaleCode, PortalI18n } from "../types/shared";
import type {
  JsonToolDefinition,
  JsonToolOptionField,
  LocalizedJsonToolDefinition,
} from "../types/jsonTools";

export const PORTAL_I18N_KEY = "portalI18n";

const LOCALE_STORAGE_KEY = "softaware-tools-locale";
const SUPPORTED_LOCALES: LocaleCode[] = ["en", "el"];
const LOCALE_TAGS: Record<LocaleCode, string> = {
  en: "en-US",
  el: "el-GR",
};

/*
  JSON tool catalog text lives in the registry, so the translation layer maps
  each tool id and input label to localized copy when those definitions are
  projected into the UI.
*/
interface JsonToolTextLocale {
  titles: Record<string, string>;
  descriptions: Record<string, string>;
  inputLabels: Record<string, string>;
}

const jsonToolText: Partial<Record<LocaleCode, JsonToolTextLocale>> = {
  el: {
    titles: {
      "beautify-json": "Μορφοποίηση JSON",
      "minify-json": "Σμίκρυνση JSON",
      "validate-json": "Έλεγχος JSON",
      "json-to-yaml": "Μετατροπή JSON σε YAML",
      "yaml-to-json": "Μετατροπή YAML σε JSON",
      "json-to-xml": "Μετατροπή JSON σε XML",
      "xml-to-json": "Μετατροπή XML σε JSON",
      "json-to-csv": "Μετατροπή JSON σε CSV",
      "csv-to-json": "Μετατροπή CSV σε JSON",
      "json-to-sql-insert": "Μετατροπή JSON σε SQL Insert",
      "sql-insert-to-json": "Μετατροπή SQL Insert σε JSON",
      "json-to-sql-query": "Μετατροπή JSON σε SQL Query",
      "json-to-base64": "Μετατροπή JSON σε Base64",
      "base64-to-json": "Μετατροπή Base64 σε JSON",
      "json-to-bson": "Μετατροπή JSON σε BSON",
      "bson-to-json": "Μετατροπή BSON σε JSON",
      "json-stringify": "JSON Stringify",
      "json-stripslashes": "JSON Stripslashes",
      "json-escape": "JSON Escape",
      "json-unescape": "JSON Unescape",
      "sort-json": "Ταξινόμηση JSON",
      "filter-json": "Φιλτράρισμα JSON",
      "count-json-objects": "Καταμέτρηση αντικειμένων JSON",
      "find-duplicate-json-objects": "Εύρεση διπλότυπων αντικειμένων JSON",
      "compare-json": "Σύγκριση JSON",
      "diff-json": "Diff JSON",
      "patch-json": "Patch JSON",
      "flatten-json": "Flatten JSON",
      "unflatten-json": "Unflatten JSON",
      "repair-json": "Επιδιόρθωση JSON",
      "redact-json": "Απόκρυψη δεδομένων JSON",
      "obfuscate-json": "Απόκρυψη τιμών JSON",
      "encode-json": "Κωδικοποίηση JSON",
      "decode-json": "Αποκωδικοποίηση JSON",
      "json-to-image": "Μετατροπή JSON σε εικόνα",
      "screenshot-json": "Στιγμιότυπο JSON",
    },
    descriptions: {
      "beautify-json": "Κάνει το JSON πιο καθαρό και ευανάγνωστο με ρυθμιζόμενη εσοχή.",
      "minify-json": "Αφαιρεί όλα τα περιττά κενά από το JSON.",
      "validate-json":
        "Ελέγχει αν το JSON είναι σωστό και προαιρετικά δίνει κανονικοποιημένο αποτέλεσμα.",
      "json-to-yaml": "Μετατρέπει το JSON σε μορφή YAML.",
      "yaml-to-json": "Μετατρέπει YAML σε σωστά μορφοποιημένο JSON.",
      "json-to-xml": "Μετατρέπει το JSON σε XML με προσαρμοσμένο root name.",
      "xml-to-json": "Μετατρέπει το XML σε δομή JSON.",
      "json-to-csv": "Μετατρέπει πίνακες αντικειμένων JSON σε γραμμές CSV.",
      "csv-to-json": "Μετατρέπει εγγραφές CSV σε γραμμές JSON.",
      "json-to-sql-insert": "Δημιουργεί SQL INSERT εντολές από αντικείμενα JSON.",
      "sql-insert-to-json": "Βγάζει γραμμές από INSERT εντολές ως JSON.",
      "json-to-sql-query": "Δημιουργεί SQL SELECT, UPDATE ή DELETE από JSON με κλειδιά και τιμές.",
      "json-to-base64": "Κωδικοποιεί συμπιεσμένο JSON σε Base64.",
      "base64-to-json": "Αποκωδικοποιεί Base64 και το μετατρέπει σε JSON.",
      "json-to-bson": "Μετατρέπει το JSON σε BSON και επιστρέφει κείμενο Base64.",
      "bson-to-json": "Αποκωδικοποιεί BSON σε Base64 και το μετατρέπει σε JSON.",
      "json-stringify": "Μετατρέπει όλο το κείμενο σε μία συμβολοσειρά JSON.",
      "json-stripslashes": "Αφαιρεί escape backslashes από αποσπάσματα κειμένου.",
      "json-escape": "Κάνει escape το κείμενο για ασφαλή χρήση μέσα σε JSON string.",
      "json-unescape": "Αφαιρεί τα escape από κείμενο JSON string.",
      "sort-json": "Ταξινομεί αναδρομικά τα keys των αντικειμένων και προαιρετικά τους πίνακες.",
      "filter-json": "Φιλτράρει JSON με έκφραση JSONPath.",
      "count-json-objects": "Μετρά τα object nodes και το μήκος του κύριου πίνακα.",
      "find-duplicate-json-objects": "Εντοπίζει διπλές εγγραφές σε πίνακες JSON.",
      "compare-json": "Ελέγχει αν δύο JSON έγγραφα είναι ισοδύναμα.",
      "diff-json": "Δημιουργεί JSON Patch ή delta ανάμεσα σε δύο JSON έγγραφα.",
      "patch-json": "Εφαρμόζει JSON Patch ενέργειες πάνω σε ένα βασικό JSON έγγραφο.",
      "flatten-json": "Μετατρέπει nested JSON σε επίπεδες διαδρομές με separator.",
      "unflatten-json": "Ξαναχτίζει nested JSON από flattened key paths.",
      "repair-json": "Προσπαθεί να διορθώσει κατεστραμμένο JSON με πιο ανεκτικό parser.",
      "redact-json": "Κρύβει ευαίσθητα κλειδιά αναδρομικά μέσα σε JSON payloads.",
      "obfuscate-json": "Κρύβει string και numeric τιμές για πιο ασφαλή διαμοιρασμό.",
      "encode-json": "Κωδικοποιεί JSON σε μορφή Base64, URI ή HEX.",
      "decode-json": "Αποκωδικοποιεί Base64, URI ή HEX και το μετατρέπει σε JSON.",
      "json-to-image": "Μετατρέπει μορφοποιημένο JSON σε εικόνα για λήψη.",
      "screenshot-json": "Δημιουργεί εικόνα τύπου screenshot με πλαίσιο κάρτας.",
    },
    inputLabels: {
      "YAML Input": "Είσοδος YAML",
      "XML Input": "Είσοδος XML",
      "CSV Input": "Είσοδος CSV",
      "SQL INSERT Input": "Είσοδος SQL INSERT",
      "Base64 Input": "Είσοδος Base64",
      "Base64 BSON Input": "Είσοδος Base64 BSON",
      "Text Input": "Είσοδος κειμένου",
      "Escaped Text Input": "Είσοδος escaped κειμένου",
      "JSON Patch Input": "Είσοδος JSON Patch",
    },
  },
};

const localizeJsonInputLabel = (label: string, locale: LocaleCode): string =>
  jsonToolText[locale]?.inputLabels?.[label] || label;

const messages = {
  en: {
    app: {
      badge: "Softaware Tools",
      navigation: "Portal navigation",
      breadcrumb: "Breadcrumb",
      guardStatus: "System check",
      checking: "checking...",
      languageLabel: "Language",
      languageToggle: "Switch language",
      guardDownTitle: "The service is not available right now",
      guardDownText: "The tools are paused because the server at {apiBaseUrl} is not responding.",
      requestReference: "Request reference",
      notAvailable: "n/a",
      openDownloadModal: "Open download window",
      readyPrefix: "Ready",
      selected: "Selected",
      none: "None",
      availableTools: "Available tools",
      selectedFiles: "Selected files",
      selectedImages: "Selected images",
      serverOfflineAction: "This action is not available while the server is offline.",
      uploadLimits: "Upload limits: up to {files} files, {fileSize} MB each, {totalSize} MB total.",
      singleFileUploadLimits:
        "Upload limits: one file only, with the same general cap of {files} files, {fileSize} MB each, {totalSize} MB total.",
      timeNow: "{time}",
    },
    languages: {
      en: "English",
      el: "Greek",
    },
    apiBaseUrl: {
      label: "API Base URL",
    },
    healthCard: {
      title: "API Guard Status",
      subtitle: "Automatic GET /api/health every 10 seconds",
      status: "Service status",
      lastChecked: "Last checked",
    },
    openApi: {
      pageTitle: "API Contract Analysis",
      pageSubtitle:
        "Contract notes and operational constraints for frontend and backend alignment.",
      swaggerTitle: "Swagger Explorer",
      swaggerSubtitle: "Live contract from",
      swaggerLoadError: "Could not load OpenAPI JSON from {url}",
      swaggerInitError: "Swagger UI could not be initialized",
    },
    flowShell: {
      stepsAria: "{serviceKey} flow steps",
      steps: {
        chooseAccess: {
          title: "Choose access",
          description: "Use a token or continue with the free plan",
        },
        configureRequest: {
          title: "Configure request",
          description: "Fill in the service form",
        },
        reviewResult: {
          title: "Review result",
          description: "Download output and inspect usage",
        },
      },
      entry: {
        stepTitle: "Step 1 · Token or free usage",
        description:
          "Choose a paid token to unlock the owner dashboard and token limits, or continue with the free plan for this service.",
        tokenPlaceholder: "Enter access token",
        checking: "Checking...",
        applyToken: "Apply token",
        continueFree: "Continue free",
      },
      activePlan: {
        stepTitle: "Step {step} · Active plan",
        openDashboard: "Open dashboard",
        changeAccess: "Change access",
      },
      quota: {
        serviceDisabled: "Service disabled for current token",
        requestsLeft: "{remaining}/{limit} requests left",
        wordsLeft: "{remaining}/{limit} words left",
        unlimited: "Unlimited",
      },
      plan: {
        token: "Paid token active for this browser session.",
        free: "Free plan selected for this service.",
      },
      errors: {
        tokenValidation: "Token validation failed.",
        freePlanContinue: "Could not continue with free plan.",
      },
    },
    accessDashboard: {
      title: "Owner dashboard",
      subtitle: "See your token limits, remaining usage, and recent service actions.",
      tokenOnlyMessage: "Apply a paid token from any service screen to unlock the owner dashboard.",
      overviewTitle: "Token overview",
      expires: "Expires",
      enabledServices: "Enabled services",
      usageByService: "Usage by service",
      recentActivity: "Recent activity",
      unlimited: "Unlimited",
      notAvailable: "n/a",
      quota: {
        requests: "{remaining}/{limit} requests",
        words: "{remaining}/{limit} words",
      },
      loading: "Loading dashboard...",
      empty: "No activity yet.",
      status: {
        success: "Success",
        failed: "Failed",
      },
      filters: {
        allServices: "All services",
        allStatuses: "All statuses",
      },
      table: {
        date: "Date",
        operation: "Operation",
        service: "Service",
        status: "Status",
        requests: "Requests",
        words: "Words",
      },
      pagination: {
        previous: "Previous",
        next: "Next",
        summary: "Page {page} of {totalPages} ({totalItems} total)",
      },
      errors: {
        loadFailed: "Could not load the dashboard.",
      },
    },
    adminTokens: {
      ariaLabel: "Admin tokens",
      notAvailable: "n/a",
      restrictedArea: "Restricted Area",
      title: "Superadmin Token Management",
      subtitle:
        "Use a CLI-created superadmin token to manage access tokens for protected services.",
      refreshing: "Refreshing...",
      refresh: "Refresh",
      sessionTitle: "Superadmin Session",
      sessionSubtitle: "Only CLI-created superadmin tokens can open this screen.",
      superadminPlaceholder: "Enter superadmin token",
      enter: "Enter",
      clear: "Clear",
      loadingList: "Loading access tokens...",
      plaintextTitle: "Plaintext Token",
      plaintextDescription:
        'Store this token for "{label}" now. It is shown only once after create or renew.',
      editAccessToken: "Edit Access Token",
      createAccessToken: "Create Access Token",
      createModalDescription:
        "Create a token in a focused form, then return to the list once the secret is issued.",
      editModalDescription:
        "Update the alias and enabled service presets without crowding the token list.",
      alias: "Alias",
      aliasPlaceholder: "Example: Books editor client",
      ttl: "TTL",
      servicePolicies: "Service policies",
      disabled: "Disabled",
      saving: "Saving...",
      saveChanges: "Save changes",
      createToken: "Create token",
      reset: "Reset",
      accessTokens: "Access Tokens",
      total: "Total",
      noAccessTokens: "No access tokens found.",
      type: "Type",
      id: "id",
      expires: "Expires",
      usageReset: "Usage reset",
      usageLabel: "Usage",
      policies: "Policies",
      none: "none",
      active: "Active",
      revoked: "Revoked",
      expired: "Expired",
      renewed: "Renewed",
      extended: "Extended",
      history: "History",
      historyDescription: 'Recent activity for "{label}".',
      historyLoading: "Loading token activity...",
      historyEmpty: "No activity recorded for this token yet.",
      resetUsageAction: "Reset usage",
      edit: "Edit",
      revoke: "Revoke",
      renew: "Renew",
      extend: "Extend",
      usage: {
        requestsUsed: "{used}/{limit} req used",
        wordsUsed: "{used}/{limit} words used",
        remaining: "{remaining} left",
        unlimited: "unlimited",
      },
      prompts: {
        revoke: 'Revoke token "{alias}" now?',
        renew: 'Renew "{alias}" for how long?',
        extend: 'Extend "{alias}" by how much?',
        resetUsage: 'Reset usage counters for "{alias}" to zero now?',
      },
      success: {
        updated: "Access token updated.",
        created: "Access token created.",
        revoked: "Access token revoked.",
        renewed: "Access token renewed.",
        extended: "Access token extended.",
        usageReset: "Access token usage reset.",
      },
      errors: {
        loadTokens: "Could not load access tokens.",
        loadHistory: "Could not load token activity.",
        enterSuperadminFirst: "Enter a superadmin token first.",
        saveToken: "Could not save the token.",
        revokeToken: "Could not revoke the token.",
        renewToken: "Could not renew the token.",
        extendToken: "Could not extend the token.",
        resetUsage: "Could not reset token usage.",
      },
    },
    routes: {
      home: "Home",
      "pdf-services": "PDF Services",
      pdf: "Merge PDF",
      "pdf-split": "Split PDF",
      "pdf-extract-to-word": "PDF to Word",
      "pdf-watermark": "Add Watermark",
      "pdf-page-numbers": "Page Numbers",
      "pdf-edit-pages": "Edit Pages",
      "pdf-extract-text": "Get Text",
      "pdf-from-images": "Images to PDF",
      "books-services": "Books Services",
      "books-greek-editor": "Greek Literature Editor",
      "image-services": "Image Services",
      image: "Compress Images",
      "image-convert": "Convert Images",
      "json-services": "JSON Services",
      "json-tool": "JSON Tool",
      contract: "API Contract",
      dashboard: "Dashboard",
      "admin-tokens": "Admin Tokens",
      donate: "Support",
    },
    pages: {
      home: {
        title: "Choose a Service",
        subtitle:
          "Pick what you want to do. Each service opens a simple screen with clear steps from upload to download.",
        pdfServicesTitle: "PDF Services",
        pdfServicesDescription:
          "Open PDF tools for merging, splitting, Word export, text export, and more.",
        booksServicesTitle: "Books Services",
        booksServicesDescription:
          "Open editing tools for Greek manuscripts or pasted text with literature-focused corrections.",
        imageServicesTitle: "Image Services",
        imageServicesDescription:
          "Open image tools for compression, conversion, and background cleanup.",
        jsonServicesTitle: "JSON Services",
        jsonServicesDescription:
          "Open JSON helper tools for formatting, conversion, checking, and visual output.",
      },
      pdfServices: {
        title: "PDF Services",
        subtitle: "Choose the PDF task you want and follow the steps on the next screen.",
      },
      booksServices: {
        title: "Books Services",
        subtitle:
          "Choose the manuscript-editing task you want and follow the steps on the next screen.",
      },
      imageServices: {
        title: "Image Services",
        subtitle: "Choose the image task you want and follow the steps on the next screen.",
      },
      donate: {
        title: "Support the Service",
        subtitle: "Small donations help keep the service online and updated for everyone.",
      },
    },
    services: {
      pdfMerge: {
        title: "Merge PDF",
        description: "Put many PDF files into one final file in the order you choose.",
      },
      pdfSplit: {
        title: "Split PDF",
        description: "Break one PDF into smaller files by range, page list, or custom groups.",
      },
      pdfToWord: {
        title: "PDF to Word",
        description: "Turn a PDF into an editable Word file, even when pages are scanned.",
      },
      pdfWatermark: {
        title: "Add Watermark",
        description: "Place text or image marks such as DRAFT or CONFIDENTIAL on a PDF.",
      },
      pdfPageNumbers: {
        title: "Page Numbers",
        description: "Add page numbers or Bates numbering to a PDF.",
      },
      pdfEditPages: {
        title: "Edit Pages",
        description: "Keep, remove, rotate, or reorder pages without using a complex editor.",
      },
      pdfExtractText: {
        title: "Get Text",
        description: "Export text from a PDF to a text file or one file per page.",
      },
      pdfFromImages: {
        title: "Images to PDF",
        description: "Combine one or more images into a single PDF.",
      },
      booksGreekEditor: {
        title: "Greek Literature Editor",
        description:
          "Edit one Word manuscript or pasted text with grouped Greek literature and spelling rules.",
      },
      imageCompression: {
        title: "Compress Images",
        description: "Reduce image size while keeping them clear enough for sharing and upload.",
      },
      imageConvert: {
        title: "Convert Images",
        description: "Change image format and, when useful, remove the background.",
      },
    },
    donation: {
      badge: "Support this project",
      title: "Help keep these tools available",
      text: "If this service was useful, you can support it with a small PayPal donation.",
      cta: "Donate with PayPal",
      hint: "Set VITE_PAYPAL_DONATE_URL to your PayPal donation link.",
    },
    modal: {
      close: "Close",
      download: "Download {name}",
      defaultTitle: "Your file is ready",
      defaultDescription: "Download your result below.",
    },
    tools: {
      pdfMerge: {
        title: "Merge PDF",
        subtitle: "Combine multiple PDF files into one final document.",
        step1: "Step 1: Select PDF files",
        step2: "Step 2: Preview, order, and rotate",
        step4: "Step 3: Create the merged PDF",
        selectedFiles: "Selected files: {count}",
        moveUp: "Move up",
        moveDown: "Move down",
        rotatePages: "Rotate pages",
        order: "Order {index}",
        previewTitle: "Preview {name}",
        create: "Create merged PDF",
        creating: "Creating...",
        ready: "Your merged PDF is ready.",
        modalTitle: "Merged PDF is ready",
        modalDescription: "Download your merged file below.",
      },
      pdfSplit: {
        title: "Split PDF",
        subtitle: "Split one PDF into smaller files in the way that fits you best.",
        step1: "Step 1: Select one PDF",
        sourcePreview: "Source preview",
        step2: "Step 2: Choose how to split",
        range: "Page range",
        selectedPages: "Specific pages",
        everyNPages: "Every N pages",
        customGroups: "Custom groups",
        step3Range: "Step 3: Page range",
        step3Pages: "Step 3: Specific pages",
        step3Size: "Step 3: Split size",
        step3Groups: "Step 3: Custom groups",
        startPage: "Start page",
        endPage: "End page",
        pageNumbers: "Page numbers (comma-separated)",
        pageNumbersHelp: "Example: 1,5,10. This creates one PDF with only those pages.",
        pagesPerFile: "Pages per output file",
        groupLabel: "Group {id}",
        groupName: "Group name",
        groupNameHint: "This is used as a simple file name hint.",
        ranges: "Page ranges",
        pages: "Extra pages",
        removeGroup: "Remove group",
        addGroup: "Add group",
        step4: "Step 4: Create the split files",
        create: "Create split files",
        creating: "Creating...",
        ready: "Your split files are ready.",
        modalTitle: "Split files are ready",
        modalDescription: "Download your split files below.",
      },
      pdfToWord: {
        title: "PDF to Word",
        subtitle: "Turn text from normal or scanned PDFs into a Word file.",
        step1: "Step 1: Select one PDF",
        sourcePreview: "Source preview",
        step2: "Step 2: Reading options",
        documentLanguage: "Document language",
        languageHelp:
          "Choose the language used in the file so scanned text is read more accurately.",
        readingQuality: "Reading quality",
        qualityHelp:
          "For scanned or hard-to-read pages, choose a stronger mode for better results.",
        keepPageBreaks: "Keep page breaks in the Word file",
        addOcrNotes: "Add a short note where scanned text reading was used",
        step3: "Step 3: Create the Word file",
        create: "Create Word file",
        creating: "Creating...",
        ready: "Your Word file is ready.",
        modalTitle: "Word file is ready",
        modalDescription: "Download your Word file below.",
      },
      pdfExtractText: {
        title: "Get Text from PDF",
        subtitle: "Export text from a PDF to one text file or one file per page.",
        sourcePdf: "Source PDF",
        perPageZip: "Create a ZIP with one text file per page",
        includePageHeaders: "Add page headings to the merged text file",
        extract: "Get text",
        extracting: "Getting text...",
        ready: "Your text file is ready.",
      },
      pdfWatermark: {
        title: "Add Watermark",
        subtitle: "Place a text or image watermark on a PDF.",
        sourcePdf: "Source PDF",
        mode: "Watermark type",
        text: "Text",
        image: "Image",
        watermarkText: "Watermark text",
        watermarkImage: "Watermark image",
        opacity: "Opacity (0.05 - 1)",
        position: "Position",
        apply: "Apply watermark",
        applying: "Applying...",
      },
      pdfPageNumbers: {
        title: "Page Numbers",
        subtitle: "Add simple page numbers or Bates numbering.",
        sourcePdf: "Source PDF",
        mode: "Mode",
        modePageNumbers: "Page numbers",
        modeBates: "Bates numbering",
        format: "Format",
        formatHelp: "You can use {page} and {total}.",
        prefix: "Prefix",
        startNumber: "Start number",
        padding: "Number length",
        position: "Position",
        apply: "Apply numbering",
        applying: "Applying...",
      },
      pdfEditPages: {
        title: "Edit Pages",
        subtitle: "Keep, remove, rotate, or reorder selected pages.",
        sourcePdf: "Source PDF",
        keepPages: "Keep pages (optional)",
        keepPagesHelp: "Leave this empty if you want to keep all pages first.",
        deletePages: "Delete pages (optional)",
        reorderPages: "Reorder pages (optional)",
        reorderPagesHelp: "Put the pages you want first. The rest stay in their original order.",
        rotatePages: "Rotate selected pages (optional)",
        rotateRowPage: "Page",
        remove: "Remove",
        addRotateRow: "Add another rotate row",
        apply: "Apply page edits",
        applying: "Applying...",
      },
      pdfFromImages: {
        title: "Images to PDF",
        subtitle: "Turn one or more images into a single PDF document.",
        sourceImages: "Source images",
        selectedImages: "Selected images: {count}",
        generate: "Create PDF",
        generating: "Creating...",
      },
      booksGreekEditor: {
        ...booksGreekEditorMessages.en,
        ui: {
          step2Title: "Step 2 · Upload document and choose rules",
          chooseInput: "Choose input",
          countingWordsDocx: "Calculating billed word count from the uploaded DOCX...",
          estimatedWords: "Estimated billed words: {count}",
          chooseRules: "Choose rules",
          rulesSubtitle: "Expand only the groups you need and keep the checklist easy to scan.",
          outputOptions: "Output options",
          runEditor: "Run editor",
          step3Title: "Step 3 · Download link and report results",
          clear: "Clear",
          processingDocument: "Processing document",
          processingDescription:
            "The editor is running. The download link and report appear here when the request completes.",
          downloadOutput: "Download output",
          downloadCorrectedDocx: "Download corrected DOCX",
          downloadDocxReady: "The corrected DOCX is ready to download from the link above.",
          downloadTextReady:
            "The corrected text is ready and can also be downloaded from the link above.",
          reportIncludedInZip:
            "The detailed report is included inside the downloaded ZIP package to avoid consuming quota twice.",
        },
      },
      imageCompression: {
        title: "Compress Images",
        subtitle: "Reduce image size while keeping them clear and useful.",
        step1: "Step 1: Select images",
        step2: "Step 2: Choose quality",
        step3: "Step 3: Create compressed files",
        modeLight: "Best quality",
        modeBalanced: "Balanced",
        modeAggressive: "Smaller files",
        modeAdvanced: "Custom settings",
        customSettings: "Custom settings",
        quality: "Quality (1-100)",
        qualityHelp: "Higher numbers usually keep more detail.",
        outputFormat: "Output format",
        maxWidth: "Max width (pixels)",
        maxHeight: "Max height (pixels)",
        effort: "Processing effort (0-9)",
        effortHelp: "Higher values can take longer.",
        lossless: "Keep exact quality when supported",
        create: "Create compressed files",
        creating: "Creating...",
        ready: "Your compressed files are ready.",
        modalTitle: "Compressed files are ready",
        modalDescription: "Download your compressed files below.",
      },
      imageConvert: {
        title: "Convert Images",
        subtitle: "Change image format and remove the background when needed.",
        step1: "Step 1: Select images",
        transparentNeedsOne: "Background removal works with one image at a time.",
        transparentNeedsOneError: "Remove extra files to continue with background removal.",
        step2: "Step 2: Choose output format",
        step3: "Step 3: File options",
        quality: "Quality (1-100)",
        effort: "Processing effort (0-9)",
        lossless: "Keep exact quality when supported",
        transparent: "Remove background",
        backgroundSelection: "Background selection method",
        backgroundAuto: "Automatic",
        backgroundPicker: "Manual",
        colorTolerance: "Color similarity (0-255)",
        backgroundHelp: "Background removal works best when the background color is fairly even.",
        noTransparency:
          "This format cannot keep transparency. Choose PNG, WEBP, AVIF, TIFF, or GIF.",
        step4: "Step 4: Preview",
        original: "Original",
        converted: "Converted preview",
        previewAltOriginal: "Original preview",
        previewAltConverted: "Converted preview",
        pickerHelp: "Click a few spots on the background so we remove the right color.",
        selectedPoints: "Selected points: {count}",
        clearPoints: "Clear points",
        step5: "Step 5: Create converted files",
        create: "Create converted files",
        creating: "Creating...",
        ready: "Your converted files are ready.",
        modalTitle: "Converted files are ready",
        modalDescription: "Download your converted files below.",
      },
      common: {
        sourcePdf: "Source PDF",
        sourcePreview: "Source preview",
        download: "Download {name}",
        requestReference: "Request reference",
        selected: "Selected: {value}",
      },
      positions: {
        center: "Center",
        "top-left": "Top left",
        "top-right": "Top right",
        "bottom-left": "Bottom left",
        "bottom-right": "Bottom right",
        "top-center": "Top center",
        "bottom-center": "Bottom center",
      },
      extractionLanguages: {
        en: "English",
        gr: "Greek",
        both: "English + Greek",
      },
      extractionQuality: {
        fast: "Quick",
        quality: "Better accuracy",
        maximum: "Maximum accuracy",
        ultra: "Best possible accuracy",
      },
      formatLabels: {
        jpeg: "JPEG (.jpg)",
        png: "PNG (.png)",
        webp: "WEBP (.webp)",
        avif: "AVIF (.avif)",
        tiff: "TIFF (.tiff)",
        gif: "GIF (.gif)",
      },
      errors: {
        selectPdfFirst: "Select one PDF file first.",
        selectImagesFirst: "Select one or more images first.",
        invalidFormValues: "Some form values are not valid.",
        editPagesFailed: "Could not edit the pages.",
        pageNumberingFailed: "Could not apply the numbering.",
        watermarkFailed: "Could not apply the watermark.",
        extractTextFailed: "Could not get text from the PDF.",
        imagesToPdfFailed: "Could not create a PDF from the images.",
        selectWatermarkImage: "Select a watermark image when image mode is active.",
        invalidPageNumber: 'Page number "{token}" is not valid.',
        rotateRowPage: "Rotate row {index}: page must be a positive number.",
        rotateRowAngle: "Rotate row {index}: angle must be 0, 90, 180, or 270.",
      },
    },
    json: {
      title: "JSON Services",
      subtitle:
        "Choose a JSON helper for formatting, conversion, checking, comparison, structure, security, or visual output.",
      searchTools: "Search tools",
      searchPlaceholder: "Search by name, category, or description",
      back: "Back to JSON Services",
      toolNotFound: "The selected JSON tool was not found.",
      toolNotFoundHelp: "Go back to the JSON list and choose one of the available tools.",
      workspace: {
        autoRun: "Run automatically when something changes",
        resetOptions: "Reset options",
        swapInputs: "Swap inputs",
        runTool: "Run tool",
        running: "Running...",
        primaryInput: "Main input",
        secondaryInput: "Second input",
        inputPlaceholder: "Paste JSON or source text here",
        secondaryInputPlaceholder: "Paste the second input here",
        options: "Options",
        enabled: "Enabled",
        inputComparison: "Input comparison",
        output: "Output",
        generatedVisualAlt: "Generated visual result",
        copyOutput: "Copy output",
        download: "Download",
        clearAll: "Clear all",
      },
      categories: {
        Format: "Format",
        Convert: "Convert",
        Analyze: "Analyze",
        Compare: "Compare",
        Structure: "Structure",
        Protect: "Protect",
        Visual: "Visual",
      },
      optionLabels: {
        indent: "Indent",
        mode: "Output mode",
        rootName: "Root element",
        hasHeader: "First row is a header",
        tableName: "Table name",
        formatSql: "Format SQL",
        queryMode: "Query type",
        arraySortMode: "Array sort",
        path: "JSONPath",
        outputMode: "Output mode",
        separator: "Separator",
        keys: "Keys to redact",
        replacement: "Replacement text",
        theme: "Theme",
        fontSize: "Font size",
        title: "Screenshot title",
      },
      optionValues: {
        mode: {
          message: "Validation message",
          normalized: "Normalized JSON",
          patch: "JSON Patch",
          delta: "Delta",
          mask: "Mask",
          reverse: "Reverse",
          hash: "Hash-like",
          base64: "Base64",
          uri: "URI",
          hex: "HEX",
        },
        queryMode: {
          select: "SELECT",
          update: "UPDATE",
          delete: "DELETE",
        },
        arraySortMode: {
          none: "Do not sort",
          asc: "Ascending",
          desc: "Descending",
        },
        outputMode: {
          details: "Detailed list",
          summary: "Summary only",
          structured: "Structured",
          pretty: "Pretty JSON",
          raw: "Raw repaired",
        },
        theme: {
          light: "Light",
          dark: "Dark",
        },
      },
    },
  },
  el: {
    app: {
      badge: "Softaware Tools",
      navigation: "Πλοήγηση",
      breadcrumb: "Διαδρομή",
      guardStatus: "Έλεγχος συστήματος",
      checking: "γίνεται έλεγχος...",
      languageLabel: "Γλώσσα",
      languageToggle: "Αλλαγή γλώσσας",
      guardDownTitle: "Η υπηρεσία δεν είναι διαθέσιμη αυτή τη στιγμή",
      guardDownText:
        "Τα εργαλεία έχουν σταματήσει προσωρινά επειδή ο διακομιστής στο {apiBaseUrl} δεν απαντά.",
      requestReference: "Κωδικός αιτήματος",
      notAvailable: "δ/υ",
      openDownloadModal: "Άνοιγμα παραθύρου λήψης",
      readyPrefix: "Έτοιμο",
      selected: "Επιλογή",
      none: "Καμία",
      availableTools: "Διαθέσιμα εργαλεία",
      selectedFiles: "Επιλεγμένα αρχεία",
      selectedImages: "Επιλεγμένες εικόνες",
      serverOfflineAction:
        "Αυτή η ενέργεια δεν είναι διαθέσιμη όσο ο διακομιστής είναι εκτός λειτουργίας.",
      uploadLimits:
        "Όρια αποστολής: έως {files} αρχεία, {fileSize} MB το καθένα, {totalSize} MB συνολικά.",
      singleFileUploadLimits:
        "Όρια αποστολής: μόνο 1 αρχείο, με το ίδιο γενικό όριο {files} αρχείων, {fileSize} MB το καθένα, {totalSize} MB συνολικά.",
      timeNow: "{time}",
    },
    languages: {
      en: "Αγγλικά",
      el: "Ελληνικά",
    },
    apiBaseUrl: {
      label: "Βασικό URL API",
    },
    healthCard: {
      title: "Κατάσταση ελέγχου API",
      subtitle: "Αυτόματο GET /api/health κάθε 10 δευτερόλεπτα",
      status: "Κατάσταση υπηρεσίας",
      lastChecked: "Τελευταίος έλεγχος",
    },
    openApi: {
      pageTitle: "Ανάλυση σύμβασης API",
      pageSubtitle:
        "Σημειώσεις σύμβασης και τεχνικοί περιορισμοί για ευθυγράμμιση frontend και backend.",
      swaggerTitle: "Περιήγηση Swagger",
      swaggerSubtitle: "Ζωντανή σύμβαση από",
      swaggerLoadError: "Δεν ήταν δυνατή η φόρτωση του OpenAPI JSON από το {url}",
      swaggerInitError: "Δεν ήταν δυνατή η εκκίνηση του Swagger UI",
    },
    flowShell: {
      stepsAria: "Βήματα ροής για {serviceKey}",
      steps: {
        chooseAccess: {
          title: "Επιλογή πρόσβασης",
          description: "Χρησιμοποιήστε token ή συνεχίστε με το free πλάνο",
        },
        configureRequest: {
          title: "Ρύθμιση αιτήματος",
          description: "Συμπληρώστε τη φόρμα της υπηρεσίας",
        },
        reviewResult: {
          title: "Έλεγχος αποτελέσματος",
          description: "Κατεβάστε το αποτέλεσμα και ελέγξτε τη χρήση",
        },
      },
      entry: {
        stepTitle: "Βήμα 1 · Token ή free χρήση",
        description:
          "Επιλέξτε paid token για owner dashboard και όρια token, ή συνεχίστε με το free πλάνο για αυτή την υπηρεσία.",
        tokenPlaceholder: "Συμπληρώστε access token",
        checking: "Έλεγχος...",
        applyToken: "Εφαρμογή token",
        continueFree: "Συνέχεια δωρεάν",
      },
      activePlan: {
        stepTitle: "Βήμα {step} · Ενεργό πλάνο",
        openDashboard: "Άνοιγμα dashboard",
        changeAccess: "Αλλαγή πρόσβασης",
      },
      quota: {
        serviceDisabled: "Η υπηρεσία είναι απενεργοποιημένη για το τρέχον token",
        requestsLeft: "{remaining}/{limit} αιτήματα υπόλοιπο",
        wordsLeft: "{remaining}/{limit} λέξεις υπόλοιπο",
        unlimited: "Απεριόριστο",
      },
      plan: {
        token: "Paid token ενεργό για αυτή τη συνεδρία browser.",
        free: "Επιλέχθηκε free πλάνο για αυτή την υπηρεσία.",
      },
      errors: {
        tokenValidation: "Η επικύρωση token απέτυχε.",
        freePlanContinue: "Δεν ήταν δυνατή η συνέχεια με το free πλάνο.",
      },
    },
    accessDashboard: {
      title: "Dashboard κατόχου",
      subtitle:
        "Δείτε τα όρια του token, το υπόλοιπο χρήσης και τις πρόσφατες ενέργειες υπηρεσιών.",
      tokenOnlyMessage:
        "Εφαρμόστε paid token από οποιαδήποτε οθόνη υπηρεσίας για να ξεκλειδώσετε το owner dashboard.",
      overviewTitle: "Επισκόπηση token",
      expires: "Λήξη",
      enabledServices: "Ενεργές υπηρεσίες",
      usageByService: "Χρήση ανά υπηρεσία",
      recentActivity: "Πρόσφατη δραστηριότητα",
      unlimited: "Απεριόριστο",
      notAvailable: "δ/υ",
      quota: {
        requests: "{remaining}/{limit} αιτήματα",
        words: "{remaining}/{limit} λέξεις",
      },
      loading: "Φόρτωση dashboard...",
      empty: "Δεν υπάρχει δραστηριότητα ακόμα.",
      status: {
        success: "Επιτυχία",
        failed: "Αποτυχία",
      },
      filters: {
        allServices: "Όλες οι υπηρεσίες",
        allStatuses: "Όλες οι καταστάσεις",
      },
      table: {
        date: "Ημερομηνία",
        operation: "Ενέργεια",
        service: "Υπηρεσία",
        status: "Κατάσταση",
        requests: "Αιτήματα",
        words: "Λέξεις",
      },
      pagination: {
        previous: "Προηγούμενο",
        next: "Επόμενο",
        summary: "Σελίδα {page} από {totalPages} ({totalItems} σύνολο)",
      },
      errors: {
        loadFailed: "Δεν ήταν δυνατή η φόρτωση του dashboard.",
      },
    },
    adminTokens: {
      ariaLabel: "Διαχείριση tokens",
      notAvailable: "δ/υ",
      restrictedArea: "Περιορισμένη πρόσβαση",
      title: "Διαχείριση tokens superadmin",
      subtitle:
        "Χρησιμοποιήστε superadmin token από το CLI για να διαχειριστείτε access tokens για προστατευμένες υπηρεσίες.",
      refreshing: "Ανανέωση...",
      refresh: "Ανανέωση",
      sessionTitle: "Συνεδρία superadmin",
      sessionSubtitle:
        "Μόνο superadmin tokens που δημιουργούνται από το CLI μπορούν να ανοίξουν αυτή την οθόνη.",
      superadminPlaceholder: "Συμπληρώστε superadmin token",
      enter: "Είσοδος",
      clear: "Καθαρισμός",
      loadingList: "Φόρτωση access tokens...",
      plaintextTitle: "Token απλού κειμένου",
      plaintextDescription:
        'Αποθηκεύστε τώρα το token για "{label}". Εμφανίζεται μόνο μία φορά μετά από δημιουργία ή ανανέωση.',
      editAccessToken: "Επεξεργασία access token",
      createAccessToken: "Δημιουργία access token",
      createModalDescription:
        "Δημιουργήστε token σε ξεχωριστή φόρμα και επιστρέψτε στη λίστα μόλις εκδοθεί το secret.",
      editModalDescription:
        "Ενημερώστε alias και presets υπηρεσιών χωρίς να φορτώνεται η λίστα με επιπλέον πεδία.",
      alias: "Alias",
      aliasPlaceholder: "Παράδειγμα: Books editor client",
      ttl: "TTL",
      servicePolicies: "Πολιτικές υπηρεσιών",
      disabled: "Απενεργοποιημένο",
      saving: "Αποθήκευση...",
      saveChanges: "Αποθήκευση αλλαγών",
      createToken: "Δημιουργία token",
      reset: "Επαναφορά",
      accessTokens: "Access tokens",
      total: "Σύνολο",
      noAccessTokens: "Δεν βρέθηκαν access tokens.",
      type: "Τύπος",
      id: "id",
      expires: "Λήγει",
      usageReset: "Μηδενισμός χρήσης",
      usageLabel: "Χρήση",
      policies: "Πολιτικές",
      none: "κανένα",
      active: "Ενεργό",
      revoked: "Ανακλήθηκε",
      expired: "Έληξε",
      renewed: "Ανανεώθηκε",
      extended: "Επεκτάθηκε",
      history: "Ιστορικό",
      historyDescription: 'Πρόσφατη δραστηριότητα για "{label}".',
      historyLoading: "Φόρτωση δραστηριότητας token...",
      historyEmpty: "Δεν έχει καταγραφεί δραστηριότητα για αυτό το token ακόμα.",
      resetUsageAction: "Μηδενισμός χρήσης",
      edit: "Επεξεργασία",
      revoke: "Ανάκληση",
      renew: "Ανανέωση",
      extend: "Επέκταση",
      usage: {
        requestsUsed: "{used}/{limit} αιτήματα",
        wordsUsed: "{used}/{limit} λέξεις",
        remaining: "{remaining} υπόλοιπο",
        unlimited: "απεριόριστο",
      },
      prompts: {
        revoke: 'Να ανακληθεί τώρα το token "{alias}";',
        renew: 'Για πόσο να ανανεωθεί το "{alias}";',
        extend: 'Κατά πόσο να επεκταθεί το "{alias}";',
        resetUsage: 'Να μηδενιστούν τώρα οι μετρητές χρήσης για το "{alias}";',
      },
      success: {
        updated: "Το access token ενημερώθηκε.",
        created: "Το access token δημιουργήθηκε.",
        revoked: "Το access token ανακλήθηκε.",
        renewed: "Το access token ανανεώθηκε.",
        extended: "Το access token επεκτάθηκε.",
        usageReset: "Η χρήση του access token μηδενίστηκε.",
      },
      errors: {
        loadTokens: "Δεν ήταν δυνατή η φόρτωση των access tokens.",
        loadHistory: "Δεν ήταν δυνατή η φόρτωση της δραστηριότητας του token.",
        enterSuperadminFirst: "Συμπληρώστε πρώτα ένα superadmin token.",
        saveToken: "Δεν ήταν δυνατή η αποθήκευση του token.",
        revokeToken: "Δεν ήταν δυνατή η ανάκληση του token.",
        renewToken: "Δεν ήταν δυνατή η ανανέωση του token.",
        extendToken: "Δεν ήταν δυνατή η επέκταση του token.",
        resetUsage: "Δεν ήταν δυνατός ο μηδενισμός χρήσης.",
      },
    },
    routes: {
      home: "Αρχική",
      "pdf-services": "Υπηρεσίες PDF",
      pdf: "Ένωση PDF",
      "pdf-split": "Χωρισμός PDF",
      "pdf-extract-to-word": "PDF σε Word",
      "pdf-watermark": "Υδατογράφημα",
      "pdf-page-numbers": "Αρίθμηση σελίδων",
      "pdf-edit-pages": "Επεξεργασία σελίδων",
      "pdf-extract-text": "Εξαγωγή κειμένου",
      "pdf-from-images": "Εικόνες σε PDF",
      "books-services": "Υπηρεσίες βιβλίων",
      "books-greek-editor": "Λογοτεχνική επιμέλεια ελληνικών βιβλίων",
      "image-services": "Υπηρεσίες εικόνας",
      image: "Συμπίεση εικόνων",
      "image-convert": "Μετατροπή εικόνων",
      "json-services": "Υπηρεσίες JSON",
      "json-tool": "Εργαλείο JSON",
      contract: "Σύμβαση API",
      dashboard: "Dashboard",
      "admin-tokens": "Διαχείριση tokens",
      donate: "Υποστήριξη",
    },
    pages: {
      home: {
        title: "Διαλέξτε υπηρεσία",
        subtitle:
          "Επιλέξτε τι θέλετε να κάνετε. Κάθε υπηρεσία ανοίγει μια απλή οθόνη με καθαρά βήματα από την αποστολή έως τη λήψη.",
        pdfServicesTitle: "Υπηρεσίες PDF",
        pdfServicesDescription:
          "Άνοιγμα εργαλείων PDF για ένωση, χωρισμό, εξαγωγή σε Word, εξαγωγή κειμένου και άλλα.",
        booksServicesTitle: "Υπηρεσίες βιβλίων",
        booksServicesDescription:
          "Άνοιγμα εργαλείων επιμέλειας για ελληνικά χειρόγραφα Word ή επικολλημένο κείμενο.",
        imageServicesTitle: "Υπηρεσίες εικόνας",
        imageServicesDescription:
          "Άνοιγμα εργαλείων εικόνας για συμπίεση, μετατροπή και καθάρισμα φόντου.",
        jsonServicesTitle: "Υπηρεσίες JSON",
        jsonServicesDescription:
          "Άνοιγμα βοηθητικών εργαλείων JSON για μορφοποίηση, μετατροπή, έλεγχο και οπτικό αποτέλεσμα.",
      },
      pdfServices: {
        title: "Υπηρεσίες PDF",
        subtitle:
          "Διαλέξτε την εργασία PDF που θέλετε και ακολουθήστε τα βήματα στην επόμενη οθόνη.",
      },
      booksServices: {
        title: "Υπηρεσίες βιβλίων",
        subtitle:
          "Διαλέξτε την εργασία επιμέλειας που θέλετε και ακολουθήστε τα βήματα στην επόμενη οθόνη.",
      },
      imageServices: {
        title: "Υπηρεσίες εικόνας",
        subtitle:
          "Διαλέξτε την εργασία εικόνας που θέλετε και ακολουθήστε τα βήματα στην επόμενη οθόνη.",
      },
      donate: {
        title: "Υποστήριξη υπηρεσίας",
        subtitle: "Μικρές δωρεές βοηθούν να μένει η υπηρεσία online και ενημερωμένη για όλους.",
      },
    },
    services: {
      pdfMerge: {
        title: "Ένωση PDF",
        description: "Βάλτε πολλά αρχεία PDF σε ένα τελικό αρχείο με τη σειρά που θέλετε.",
      },
      pdfSplit: {
        title: "Χωρισμός PDF",
        description:
          "Χωρίστε ένα PDF σε μικρότερα αρχεία με εύρος, λίστα σελίδων ή δικές σας ομάδες.",
      },
      pdfToWord: {
        title: "PDF σε Word",
        description:
          "Μετατρέψτε ένα PDF σε επεξεργάσιμο Word, ακόμη και όταν οι σελίδες είναι σαρωμένες.",
      },
      pdfWatermark: {
        title: "Υδατογράφημα",
        description: "Προσθέστε κείμενο ή εικόνα, όπως DRAFT ή CONFIDENTIAL, πάνω σε ένα PDF.",
      },
      pdfPageNumbers: {
        title: "Αρίθμηση σελίδων",
        description: "Προσθέστε απλή αρίθμηση σελίδων ή Bates numbering σε ένα PDF.",
      },
      pdfEditPages: {
        title: "Επεξεργασία σελίδων",
        description:
          "Κρατήστε, αφαιρέστε, περιστρέψτε ή αλλάξτε σειρά σελίδων χωρίς πολύπλοκο editor.",
      },
      pdfExtractText: {
        title: "Εξαγωγή κειμένου",
        description:
          "Βγάλτε το κείμενο από PDF σε αρχείο κειμένου ή σε ξεχωριστό αρχείο ανά σελίδα.",
      },
      pdfFromImages: {
        title: "Εικόνες σε PDF",
        description: "Συνδυάστε μία ή περισσότερες εικόνες σε ένα PDF.",
      },
      booksGreekEditor: {
        title: "Λογοτεχνική επιμέλεια ελληνικών βιβλίων",
        description:
          "Επιμεληθείτε χειρόγραφο Word ή επικολλημένο κείμενο με ομαδοποιημένους λογοτεχνικούς και ορθογραφικούς κανόνες.",
      },
      imageCompression: {
        title: "Συμπίεση εικόνων",
        description: "Μειώστε το μέγεθος εικόνων χωρίς να χαθεί υπερβολικά η καθαρότητα.",
      },
      imageConvert: {
        title: "Μετατροπή εικόνων",
        description: "Αλλάξτε μορφή εικόνας και, όταν χρειάζεται, αφαιρέστε το φόντο.",
      },
    },
    donation: {
      badge: "Υποστηρίξτε αυτό το project",
      title: "Βοηθήστε να παραμείνουν διαθέσιμα αυτά τα εργαλεία",
      text: "Αν η υπηρεσία σας βοήθησε, μπορείτε να την υποστηρίξετε με μια μικρή δωρεά μέσω PayPal.",
      cta: "Δωρεά με PayPal",
      hint: "Ορίστε το VITE_PAYPAL_DONATE_URL με το PayPal link για δωρεές.",
    },
    modal: {
      close: "Κλείσιμο",
      download: "Λήψη {name}",
      defaultTitle: "Το αρχείο σας είναι έτοιμο",
      defaultDescription: "Κατεβάστε το αποτέλεσμα παρακάτω.",
    },
    tools: {
      pdfMerge: {
        title: "Ένωση PDF",
        subtitle: "Συνδυάστε πολλά PDF σε ένα τελικό έγγραφο.",
        step1: "Βήμα 1: Επιλέξτε αρχεία PDF",
        step2: "Βήμα 2: Προεπισκόπηση, σειρά και περιστροφή",
        step4: "Βήμα 3: Δημιουργία ενωμένου PDF",
        selectedFiles: "Επιλεγμένα αρχεία: {count}",
        moveUp: "Μετακίνηση πάνω",
        moveDown: "Μετακίνηση κάτω",
        rotatePages: "Περιστροφή σελίδων",
        order: "Σειρά {index}",
        previewTitle: "Προεπισκόπηση {name}",
        create: "Δημιουργία ενωμένου PDF",
        creating: "Δημιουργία...",
        ready: "Το ενωμένο PDF είναι έτοιμο.",
        modalTitle: "Το ενωμένο PDF είναι έτοιμο",
        modalDescription: "Κατεβάστε το ενωμένο αρχείο παρακάτω.",
      },
      pdfSplit: {
        title: "Χωρισμός PDF",
        subtitle: "Χωρίστε ένα PDF σε μικρότερα αρχεία με τον τρόπο που σας βολεύει.",
        step1: "Βήμα 1: Επιλέξτε ένα PDF",
        sourcePreview: "Προεπισκόπηση αρχείου",
        step2: "Βήμα 2: Διαλέξτε τρόπο χωρισμού",
        range: "Εύρος σελίδων",
        selectedPages: "Συγκεκριμένες σελίδες",
        everyNPages: "Κάθε N σελίδες",
        customGroups: "Δικές σας ομάδες",
        step3Range: "Βήμα 3: Εύρος σελίδων",
        step3Pages: "Βήμα 3: Συγκεκριμένες σελίδες",
        step3Size: "Βήμα 3: Μέγεθος χωρισμού",
        step3Groups: "Βήμα 3: Δικές σας ομάδες",
        startPage: "Από σελίδα",
        endPage: "Έως σελίδα",
        pageNumbers: "Αριθμοί σελίδων (χωρισμένοι με κόμμα)",
        pageNumbersHelp: "Παράδειγμα: 1,5,10. Δημιουργεί ένα PDF μόνο με αυτές τις σελίδες.",
        pagesPerFile: "Σελίδες ανά αρχείο",
        groupLabel: "Ομάδα {id}",
        groupName: "Όνομα ομάδας",
        groupNameHint: "Χρησιμοποιείται σαν απλή βοήθεια για το όνομα αρχείου.",
        ranges: "Εύρη σελίδων",
        pages: "Επιπλέον σελίδες",
        removeGroup: "Αφαίρεση ομάδας",
        addGroup: "Προσθήκη ομάδας",
        step4: "Βήμα 4: Δημιουργία χωρισμένων αρχείων",
        create: "Δημιουργία χωρισμένων αρχείων",
        creating: "Δημιουργία...",
        ready: "Τα χωρισμένα αρχεία είναι έτοιμα.",
        modalTitle: "Τα χωρισμένα αρχεία είναι έτοιμα",
        modalDescription: "Κατεβάστε τα χωρισμένα αρχεία παρακάτω.",
      },
      pdfToWord: {
        title: "PDF σε Word",
        subtitle: "Μετατρέψτε κείμενο από κανονικά ή σαρωμένα PDF σε αρχείο Word.",
        step1: "Βήμα 1: Επιλέξτε ένα PDF",
        sourcePreview: "Προεπισκόπηση αρχείου",
        step2: "Βήμα 2: Επιλογές ανάγνωσης",
        documentLanguage: "Γλώσσα εγγράφου",
        languageHelp: "Διαλέξτε τη γλώσσα του αρχείου για πιο σωστή ανάγνωση σαρωμένου κειμένου.",
        readingQuality: "Ποιότητα ανάγνωσης",
        qualityHelp:
          "Για σαρωμένες ή δύσκολες σελίδες, διαλέξτε πιο δυνατό τρόπο για καλύτερο αποτέλεσμα.",
        keepPageBreaks: "Να μείνουν τα αλλαγές σελίδας στο Word",
        addOcrNotes: "Προσθήκη μικρής σημείωσης όπου χρησιμοποιήθηκε ανάγνωση σαρωμένου κειμένου",
        step3: "Βήμα 3: Δημιουργία αρχείου Word",
        create: "Δημιουργία Word",
        creating: "Δημιουργία...",
        ready: "Το αρχείο Word είναι έτοιμο.",
        modalTitle: "Το αρχείο Word είναι έτοιμο",
        modalDescription: "Κατεβάστε το αρχείο Word παρακάτω.",
      },
      pdfExtractText: {
        title: "Εξαγωγή κειμένου από PDF",
        subtitle: "Βγάλτε το κείμενο από PDF σε ένα αρχείο ή σε ξεχωριστό αρχείο ανά σελίδα.",
        sourcePdf: "Αρχικό PDF",
        perPageZip: "Δημιουργία ZIP με ένα αρχείο κειμένου ανά σελίδα",
        includePageHeaders: "Προσθήκη τίτλων σελίδας στο ενιαίο αρχείο κειμένου",
        extract: "Εξαγωγή κειμένου",
        extracting: "Γίνεται εξαγωγή...",
        ready: "Το αρχείο κειμένου είναι έτοιμο.",
      },
      pdfWatermark: {
        title: "Υδατογράφημα",
        subtitle: "Βάλτε υδατογράφημα κειμένου ή εικόνας σε PDF.",
        sourcePdf: "Αρχικό PDF",
        mode: "Τύπος υδατογραφήματος",
        text: "Κείμενο",
        image: "Εικόνα",
        watermarkText: "Κείμενο υδατογραφήματος",
        watermarkImage: "Εικόνα υδατογραφήματος",
        opacity: "Διαφάνεια (0.05 - 1)",
        position: "Θέση",
        apply: "Εφαρμογή υδατογραφήματος",
        applying: "Γίνεται εφαρμογή...",
      },
      pdfPageNumbers: {
        title: "Αρίθμηση σελίδων",
        subtitle: "Προσθέστε απλή αρίθμηση σελίδων ή Bates numbering.",
        sourcePdf: "Αρχικό PDF",
        mode: "Λειτουργία",
        modePageNumbers: "Αριθμοί σελίδων",
        modeBates: "Bates numbering",
        format: "Μορφή",
        formatHelp: "Μπορείτε να χρησιμοποιήσετε {page} και {total}.",
        prefix: "Πρόθεμα",
        startNumber: "Αρχικός αριθμός",
        padding: "Μήκος αριθμού",
        position: "Θέση",
        apply: "Εφαρμογή αρίθμησης",
        applying: "Γίνεται εφαρμογή...",
      },
      pdfEditPages: {
        title: "Επεξεργασία σελίδων",
        subtitle: "Κρατήστε, αφαιρέστε, περιστρέψτε ή αλλάξτε σειρά στις επιλεγμένες σελίδες.",
        sourcePdf: "Αρχικό PDF",
        keepPages: "Κράτημα σελίδων (προαιρετικό)",
        keepPagesHelp: "Αφήστε το κενό αν θέλετε αρχικά να κρατηθούν όλες οι σελίδες.",
        deletePages: "Διαγραφή σελίδων (προαιρετικό)",
        reorderPages: "Αλλαγή σειράς σελίδων (προαιρετικό)",
        reorderPagesHelp:
          "Βάλτε πρώτες τις σελίδες που θέλετε. Οι υπόλοιπες μένουν με την αρχική τους σειρά.",
        rotatePages: "Περιστροφή επιλεγμένων σελίδων (προαιρετικό)",
        rotateRowPage: "Σελίδα",
        remove: "Αφαίρεση",
        addRotateRow: "Προσθήκη ακόμη μίας γραμμής περιστροφής",
        apply: "Εφαρμογή αλλαγών",
        applying: "Γίνεται εφαρμογή...",
      },
      pdfFromImages: {
        title: "Εικόνες σε PDF",
        subtitle: "Μετατρέψτε μία ή περισσότερες εικόνες σε ένα PDF.",
        sourceImages: "Αρχικές εικόνες",
        selectedImages: "Επιλεγμένες εικόνες: {count}",
        generate: "Δημιουργία PDF",
        generating: "Δημιουργία...",
      },
      booksGreekEditor: {
        ...booksGreekEditorMessages.el,
        ui: {
          step2Title: "Βήμα 2 · Ανέβασμα εγγράφου και επιλογή κανόνων",
          chooseInput: "Επιλογή εισόδου",
          countingWordsDocx: "Υπολογίζεται το χρεώσιμο πλήθος λέξεων από το DOCX...",
          estimatedWords: "Εκτιμώμενες χρεώσιμες λέξεις: {count}",
          chooseRules: "Επιλογή κανόνων",
          rulesSubtitle:
            "Αναπτύξτε μόνο τις ομάδες που χρειάζεστε και κρατήστε τη λίστα εύκολη στον έλεγχο.",
          outputOptions: "Επιλογές εξόδου",
          runEditor: "Εκτέλεση editor",
          step3Title: "Βήμα 3 · Σύνδεσμος λήψης και αποτελέσματα report",
          clear: "Καθαρισμός",
          processingDocument: "Γίνεται επεξεργασία εγγράφου",
          processingDescription:
            "Ο editor εκτελείται. Ο σύνδεσμος λήψης και το report θα εμφανιστούν εδώ όταν ολοκληρωθεί το αίτημα.",
          downloadOutput: "Λήψη αποτελέσματος",
          downloadCorrectedDocx: "Λήψη διορθωμένου DOCX",
          downloadDocxReady: "Το διορθωμένο DOCX είναι έτοιμο για λήψη από τον παραπάνω σύνδεσμο.",
          downloadTextReady:
            "Το διορθωμένο κείμενο είναι έτοιμο και μπορεί επίσης να ληφθεί από τον παραπάνω σύνδεσμο.",
          reportIncludedInZip:
            "Το αναλυτικό report περιλαμβάνεται μέσα στο ZIP λήψης ώστε να μην καταναλώνεται το quota δύο φορές.",
        },
      },
      imageCompression: {
        title: "Συμπίεση εικόνων",
        subtitle: "Μειώστε το μέγεθος εικόνων χωρίς να χαλάει υπερβολικά η ποιότητα.",
        step1: "Βήμα 1: Επιλέξτε εικόνες",
        step2: "Βήμα 2: Διαλέξτε ποιότητα",
        step3: "Βήμα 3: Δημιουργία συμπιεσμένων αρχείων",
        modeLight: "Καλύτερη ποιότητα",
        modeBalanced: "Ισορροπημένο",
        modeAggressive: "Μικρότερα αρχεία",
        modeAdvanced: "Προσαρμοσμένες ρυθμίσεις",
        customSettings: "Προσαρμοσμένες ρυθμίσεις",
        quality: "Ποιότητα (1-100)",
        qualityHelp: "Μεγαλύτερος αριθμός κρατά συνήθως περισσότερη λεπτομέρεια.",
        outputFormat: "Μορφή εξόδου",
        maxWidth: "Μέγιστο πλάτος (pixels)",
        maxHeight: "Μέγιστο ύψος (pixels)",
        effort: "Ένταση επεξεργασίας (0-9)",
        effortHelp: "Μεγαλύτερες τιμές μπορεί να αργήσουν περισσότερο.",
        lossless: "Διατήρηση ακριβούς ποιότητας όταν υποστηρίζεται",
        create: "Δημιουργία συμπιεσμένων αρχείων",
        creating: "Δημιουργία...",
        ready: "Τα συμπιεσμένα αρχεία είναι έτοιμα.",
        modalTitle: "Τα συμπιεσμένα αρχεία είναι έτοιμα",
        modalDescription: "Κατεβάστε τα συμπιεσμένα αρχεία παρακάτω.",
      },
      imageConvert: {
        title: "Μετατροπή εικόνων",
        subtitle: "Αλλάξτε μορφή εικόνας και αφαιρέστε φόντο όταν χρειάζεται.",
        step1: "Βήμα 1: Επιλέξτε εικόνες",
        transparentNeedsOne: "Η αφαίρεση φόντου λειτουργεί με μία εικόνα κάθε φορά.",
        transparentNeedsOneError:
          "Αφαιρέστε τα επιπλέον αρχεία για να συνεχίσετε με αφαίρεση φόντου.",
        step2: "Βήμα 2: Διαλέξτε μορφή εξόδου",
        step3: "Βήμα 3: Επιλογές αρχείου",
        quality: "Ποιότητα (1-100)",
        effort: "Ένταση επεξεργασίας (0-9)",
        lossless: "Διατήρηση ακριβούς ποιότητας όταν υποστηρίζεται",
        transparent: "Αφαίρεση φόντου",
        backgroundSelection: "Τρόπος επιλογής φόντου",
        backgroundAuto: "Αυτόματα",
        backgroundPicker: "Χειροκίνητα",
        colorTolerance: "Ομοιότητα χρώματος (0-255)",
        backgroundHelp:
          "Η αφαίρεση φόντου δουλεύει καλύτερα όταν το φόντο έχει σχετικά ομοιόμορφο χρώμα.",
        noTransparency: "Αυτή η μορφή δεν κρατά διαφάνεια. Επιλέξτε PNG, WEBP, AVIF, TIFF ή GIF.",
        step4: "Βήμα 4: Προεπισκόπηση",
        original: "Αρχική",
        converted: "Προεπισκόπηση αποτελέσματος",
        previewAltOriginal: "Προεπισκόπηση αρχικής εικόνας",
        previewAltConverted: "Προεπισκόπηση αποτελέσματος",
        pickerHelp: "Κάντε κλικ σε λίγα σημεία του φόντου για να αφαιρεθεί το σωστό χρώμα.",
        selectedPoints: "Επιλεγμένα σημεία: {count}",
        clearPoints: "Καθαρισμός σημείων",
        step5: "Βήμα 5: Δημιουργία μετατρεμμένων αρχείων",
        create: "Δημιουργία μετατρεμμένων αρχείων",
        creating: "Δημιουργία...",
        ready: "Τα μετατρεμμένα αρχεία είναι έτοιμα.",
        modalTitle: "Τα μετατρεμμένα αρχεία είναι έτοιμα",
        modalDescription: "Κατεβάστε τα μετατρεμμένα αρχεία παρακάτω.",
      },
      common: {
        sourcePdf: "Αρχικό PDF",
        sourcePreview: "Προεπισκόπηση αρχείου",
        download: "Λήψη {name}",
        requestReference: "Κωδικός αιτήματος",
        selected: "Επιλογή: {value}",
      },
      positions: {
        center: "Κέντρο",
        "top-left": "Πάνω αριστερά",
        "top-right": "Πάνω δεξιά",
        "bottom-left": "Κάτω αριστερά",
        "bottom-right": "Κάτω δεξιά",
        "top-center": "Πάνω κέντρο",
        "bottom-center": "Κάτω κέντρο",
      },
      extractionLanguages: {
        en: "Αγγλικά",
        gr: "Ελληνικά",
        both: "Αγγλικά + Ελληνικά",
      },
      extractionQuality: {
        fast: "Γρήγορο",
        quality: "Καλύτερη ακρίβεια",
        maximum: "Μέγιστη ακρίβεια",
        ultra: "Η καλύτερη δυνατή ακρίβεια",
      },
      formatLabels: {
        jpeg: "JPEG (.jpg)",
        png: "PNG (.png)",
        webp: "WEBP (.webp)",
        avif: "AVIF (.avif)",
        tiff: "TIFF (.tiff)",
        gif: "GIF (.gif)",
      },
      errors: {
        selectPdfFirst: "Επιλέξτε πρώτα ένα αρχείο PDF.",
        selectImagesFirst: "Επιλέξτε πρώτα μία ή περισσότερες εικόνες.",
        invalidFormValues: "Κάποιες τιμές της φόρμας δεν είναι σωστές.",
        editPagesFailed: "Δεν ήταν δυνατή η επεξεργασία των σελίδων.",
        pageNumberingFailed: "Δεν ήταν δυνατή η εφαρμογή της αρίθμησης.",
        watermarkFailed: "Δεν ήταν δυνατή η εφαρμογή του υδατογραφήματος.",
        extractTextFailed: "Δεν ήταν δυνατή η εξαγωγή κειμένου από το PDF.",
        imagesToPdfFailed: "Δεν ήταν δυνατή η δημιουργία PDF από τις εικόνες.",
        selectWatermarkImage:
          "Επιλέξτε εικόνα υδατογραφήματος όταν είναι ενεργή η λειτουργία εικόνας.",
        invalidPageNumber: 'Ο αριθμός σελίδας "{token}" δεν είναι έγκυρος.',
        rotateRowPage: "Γραμμή περιστροφής {index}: η σελίδα πρέπει να είναι θετικός αριθμός.",
        rotateRowAngle: "Γραμμή περιστροφής {index}: η γωνία πρέπει να είναι 0, 90, 180 ή 270.",
      },
    },
    json: {
      title: "Υπηρεσίες JSON",
      subtitle:
        "Διαλέξτε ένα βοηθητικό εργαλείο JSON για μορφοποίηση, μετατροπή, έλεγχο, σύγκριση, δομή, ασφάλεια ή οπτικό αποτέλεσμα.",
      searchTools: "Αναζήτηση εργαλείων",
      searchPlaceholder: "Αναζήτηση με όνομα, κατηγορία ή περιγραφή",
      back: "Επιστροφή στις υπηρεσίες JSON",
      toolNotFound: "Το επιλεγμένο εργαλείο JSON δεν βρέθηκε.",
      toolNotFoundHelp: "Επιστρέψτε στη λίστα JSON και διαλέξτε ένα από τα διαθέσιμα εργαλεία.",
      workspace: {
        autoRun: "Αυτόματη εκτέλεση όταν αλλάζει κάτι",
        resetOptions: "Επαναφορά επιλογών",
        swapInputs: "Αλλαγή θέσης εισόδων",
        runTool: "Εκτέλεση εργαλείου",
        running: "Εκτελείται...",
        primaryInput: "Κύρια είσοδος",
        secondaryInput: "Δεύτερη είσοδος",
        inputPlaceholder: "Επικολλήστε εδώ JSON ή άλλο κείμενο",
        secondaryInputPlaceholder: "Επικολλήστε εδώ τη δεύτερη είσοδο",
        options: "Επιλογές",
        enabled: "Ενεργό",
        inputComparison: "Σύγκριση εισόδων",
        output: "Αποτέλεσμα",
        generatedVisualAlt: "Παραγόμενο οπτικό αποτέλεσμα",
        copyOutput: "Αντιγραφή αποτελέσματος",
        download: "Λήψη",
        clearAll: "Καθαρισμός όλων",
      },
      categories: {
        Format: "Μορφοποίηση",
        Convert: "Μετατροπή",
        Analyze: "Ανάλυση",
        Compare: "Σύγκριση",
        Structure: "Δομή",
        Protect: "Προστασία",
        Visual: "Οπτικό",
      },
      optionLabels: {
        indent: "Εσοχή",
        mode: "Τρόπος εξόδου",
        rootName: "Ριζικό στοιχείο",
        hasHeader: "Η πρώτη γραμμή είναι επικεφαλίδα",
        tableName: "Όνομα πίνακα",
        formatSql: "Μορφοποίηση SQL",
        queryMode: "Τύπος ερωτήματος",
        arraySortMode: "Ταξινόμηση πίνακα",
        path: "JSONPath",
        outputMode: "Τρόπος εξόδου",
        separator: "Διαχωριστικό",
        keys: "Κλειδιά για απόκρυψη",
        replacement: "Κείμενο αντικατάστασης",
        theme: "Θέμα",
        fontSize: "Μέγεθος γραμματοσειράς",
        title: "Τίτλος screenshot",
      },
      optionValues: {
        mode: {
          message: "Μήνυμα ελέγχου",
          normalized: "Κανονικοποιημένο JSON",
          patch: "JSON Patch",
          delta: "Delta",
          mask: "Μάσκα",
          reverse: "Αντιστροφή",
          hash: "Τύπου hash",
          base64: "Base64",
          uri: "URI",
          hex: "HEX",
        },
        queryMode: {
          select: "SELECT",
          update: "UPDATE",
          delete: "DELETE",
        },
        arraySortMode: {
          none: "Χωρίς ταξινόμηση",
          asc: "Αύξουσα",
          desc: "Φθίνουσα",
        },
        outputMode: {
          details: "Αναλυτική λίστα",
          summary: "Μόνο σύνοψη",
          structured: "Δομημένο",
          pretty: "Μορφοποιημένο JSON",
          raw: "Ακατέργαστο διορθωμένο",
        },
        theme: {
          light: "Φωτεινό",
          dark: "Σκούρο",
        },
      },
    },
  },
};

const resolveMessage = (locale: LocaleCode, path: string): unknown =>
  path.split(".").reduce<unknown>(
    (value, segment) => {
      if (!value || typeof value !== "object") {
        return undefined;
      }

      return (value as Record<string, unknown>)[segment];
    },
    messages[locale] as Record<string, unknown>
  );

const interpolate = (value: unknown, params: Record<string, unknown> = {}): string =>
  String(value).replace(/\{(\w+)\}/g, (_, key) =>
    params[key] === undefined || params[key] === null ? `{${key}}` : String(params[key])
  );

export const createPortalI18n = (): PortalI18n => {
  const browserLocale = typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : "en";
  const storedLocale =
    typeof window !== "undefined" ? window.localStorage.getItem(LOCALE_STORAGE_KEY) : null;
  const initialLocale = SUPPORTED_LOCALES.includes(storedLocale as LocaleCode)
    ? (storedLocale as LocaleCode)
    : SUPPORTED_LOCALES.includes(browserLocale as LocaleCode)
      ? (browserLocale as LocaleCode)
      : "en";
  const locale = ref<LocaleCode>(initialLocale);

  const setLocale = (nextLocale: LocaleCode) => {
    if (!SUPPORTED_LOCALES.includes(nextLocale)) {
      return;
    }

    locale.value = nextLocale;
  };

  const t = (path: string, params: Record<string, unknown> = {}, fallback = path): string => {
    const current = resolveMessage(locale.value, path);
    const english = resolveMessage("en", path);
    const selected = current ?? english ?? fallback;
    return interpolate(selected, params);
  };

  const formatDate = (value?: string | number | Date | null): string => {
    if (!value) {
      return "";
    }

    return new Intl.DateTimeFormat(LOCALE_TAGS[locale.value], {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(value));
  };

  const formatTime = (value?: string | number | Date | null): string => {
    if (!value) {
      return "";
    }

    return new Intl.DateTimeFormat(LOCALE_TAGS[locale.value], {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  };

  watch(
    locale,
    (nextLocale) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
      }

      if (typeof document !== "undefined") {
        document.documentElement.lang = nextLocale;
      }
    },
    { immediate: true }
  );

  return {
    locale,
    messages: messages as PortalI18n["messages"],
    setLocale,
    t,
    formatDate,
    formatTime,
  };
};

export const usePortalI18n = (): PortalI18n | undefined => inject(PORTAL_I18N_KEY) as PortalI18n;

const buildOptionLabels = (
  field: JsonToolOptionField,
  t: PortalI18n["t"]
): JsonToolOptionField["options"] =>
  (field.options || []).map((item) => ({
    ...item,
    label: t(`json.optionValues.${field.key}.${item.value}`, {}, item.label),
  }));

const localizeToolDefaultValue = (
  field: JsonToolOptionField,
  locale: LocaleCode
): string | number | boolean => {
  if (field.key === "title" && field.defaultValue === "JSON Preview") {
    return locale === "el" ? "Προεπισκόπηση JSON" : field.defaultValue;
  }

  return field.defaultValue;
};

export const localizeJsonToolDefinition = (
  tool: JsonToolDefinition,
  locale: LocaleCode,
  i18n: PortalI18n
): JsonToolDefinition => ({
  ...tool,
  title: i18n.t(`json.titles.${tool.id}`, {}, tool.title),
  description: i18n.t(`json.descriptions.${tool.id}`, {}, tool.description),
  inputLabel: tool.inputLabel ? localizeJsonInputLabel(tool.inputLabel, locale) : tool.inputLabel,
  secondaryInputLabel: tool.secondaryInputLabel
    ? localizeJsonInputLabel(tool.secondaryInputLabel, locale)
    : tool.secondaryInputLabel,
  optionsSchema: tool.optionsSchema.map((field) => ({
    ...field,
    label: i18n.t(`json.optionLabels.${field.key}`, {}, field.label),
    defaultValue: localizeToolDefaultValue(field, locale),
    options: buildOptionLabels(field, i18n.t),
  })),
});

export const localizeJsonTool = (
  tool: JsonToolDefinition,
  {
    t,
    locale,
  }: {
    t: PortalI18n["t"];
    locale: LocaleCode;
  }
): LocalizedJsonToolDefinition => ({
  ...tool,
  title: jsonToolText[locale]?.titles?.[tool.id] || tool.title,
  category: t(`json.categories.${tool.category}`, {}, tool.category),
  description: jsonToolText[locale]?.descriptions?.[tool.id] || tool.description,
  inputLabel: tool.inputLabel ? localizeJsonInputLabel(tool.inputLabel, locale) : tool.inputLabel,
  secondaryInputLabel: tool.secondaryInputLabel
    ? localizeJsonInputLabel(tool.secondaryInputLabel, locale)
    : tool.secondaryInputLabel,
  optionsSchema: (tool.optionsSchema || []).map((field) => ({
    ...field,
    label: t(`json.optionLabels.${field.key}`, {}, field.label),
    defaultValue: localizeToolDefaultValue(field, locale),
    options: buildOptionLabels(field, t),
  })),
});
