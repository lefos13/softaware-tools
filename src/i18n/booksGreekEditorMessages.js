/*
  The Books editor copy lives in one module because the rule catalog is large
  and both locales need aligned titles, examples, cases, and preference labels.
*/
export const booksGreekEditorMessages = {
  en: {
    title: "Greek Literature Editor",
    subtitle: "Apply selected Greek book-editing rules to one Word manuscript or pasted text.",
    inputMode: "Input mode",
    modes: {
      docx: "Word manuscript",
      text: "Paste text",
    },
    step1: "Step 1: Choose your input",
    step2: "Step 2: Choose the corrections to apply",
    step3: "Step 3: Output options",
    step4: "Step 4: Run the editor",
    scopeNote:
      "DOCX mode edits only the main manuscript body. Headers, footers, notes, comments, and text boxes stay unchanged.",
    textModeNote:
      "Text mode returns the corrected text directly on the page so you can review it before downloading.",
    textPlaceholder: "Paste the Greek text you want to edit here.",
    selectedRules: "Selected rules: {count}",
    selectAllRules: "Apply all available rules",
    selectAllRulesHelp:
      "Turns on every rule in both sections. You can still clear individual rules afterwards.",
    includeReport: "Include a detailed before/after report",
    includeReportHelp:
      "DOCX mode returns a ZIP package with the edited manuscript and report files. Text mode shows the report below and lets you download it as text.",
    apply: "Apply selected corrections",
    applying: "Applying...",
    ready: "Your corrected manuscript is ready.",
    modalTitle: "Corrected manuscript is ready",
    modalDescription: "Download your corrected file below.",
    textResultTitle: "Corrected text",
    reportTitle: "Detailed report",
    reportOccurrences: "{count} changes",
    reportSentenceBefore: "Sentence before",
    reportSentenceAfter: "Sentence after",
    downloadCorrectedText: "Download corrected text",
    downloadReport: "Download report",
    reportStats: {
      totalChanges: "Total changes",
      rulesTouched: "Rules that changed text",
      changedParagraphs: "Paragraphs changed",
    },
    ruleHelp: "See example and affected cases",
    exampleLabel: "Example",
    casesLabel: "Affected cases",
    sections: {
      literary: {
        title: "Literary style rules",
        description: "Editorial corrections for flow, contractions, spacing, and punctuation.",
      },
      orthography: {
        title: "Common spelling rules",
        description: "Frequent orthographic normalizations and spelling corrections.",
      },
      preferences: {
        title: "Preference-based rules",
        description:
          "Rules that apply one of multiple valid forms based on the user's preferred style.",
      },
    },
    preferences: {
      denNegationStyle: {
        label: 'Preferred style for "δεν / δε"',
        options: {
          contextual: 'Use contextual "δε"',
          alwaysDen: 'Always use "δεν"',
        },
      },
      andrasStyle: {
        label: 'Preferred form for "άντρας / άνδρας"',
        options: {
          antras: 'Prefer "άντρας"',
          andras: 'Prefer "άνδρας"',
        },
      },
      avgoStyle: {
        label: 'Preferred form for "αβγό / αυγό"',
        options: {
          avgo: 'Prefer "αυγό"',
          avgoBeta: 'Prefer "αβγό"',
        },
      },
      quotePeriodStyle: {
        label: "Preferred placement for period and closing quote",
        options: {
          outside: 'Prefer "». "',
          inside: 'Prefer ".»"',
        },
      },
    },
    rules: {
      kai_before_vowel: {
        title: 'Change "και" to "κι" before vowels',
        description:
          'Turns standalone "και" into "κι" when the next Greek word starts with a vowel, accented or not.',
        example: "και αγάπη -> κι αγάπη",
        cases: "και α..., και ε..., και η..., και ι..., και ο..., και υ..., και ω...",
      },
      stin_article_trim: {
        title: 'Shorten "(σ)την" before specific consonants',
        description:
          'Turns "στην" into "στη" and "την" into "τη" before β, γ, δ, ζ, θ, λ, μ, ν, ρ, σ, φ, χ, excluding γγ, γκ, μπ, ντ.',
        example: "στην βροχή -> στη βροχή, την λάμψη -> τη λάμψη",
        cases: "β, γ, δ, ζ, θ, λ, μ, ν, ρ, σ, φ, χ except γγ, γκ, μπ, ντ",
      },
      min_negation_trim: {
        title: 'Shorten "μην" before specific consonants',
        description:
          'Turns "μην" into "μη" before β, γ, δ, ζ, θ, λ, μ, ν, ρ, σ, φ, χ, excluding γγ, γκ, μπ, ντ.',
        example: "μην βγεις -> μη βγεις",
        cases: "β, γ, δ, ζ, θ, λ, μ, ν, ρ, σ, φ, χ except γγ, γκ, μπ, ντ",
      },
      sa_to_san: {
        title: 'Change standalone "σα" to "σαν"',
        description: 'Turns the standalone word "σα" into "σαν".',
        example: "σα λύκος -> σαν λύκος",
        cases: 'Only the standalone word, not larger words such as "σαλόνι".',
      },
      ellipsis_normalize: {
        title: "Normalize long dot runs to ellipsis",
        description: "Replaces any sequence of four or more periods with exactly three dots.",
        example: "Περίμενε..... -> Περίμενε...",
        cases: "...., ....., ...... -> ...",
      },
      multiple_spaces_normalize: {
        title: "Collapse repeated spaces",
        description: "Turns two or more consecutive spaces into one space.",
        example: "λέξη  λέξη -> λέξη λέξη",
        cases: "Any horizontal space run inside the text body.",
      },
      guillemets_normalize: {
        title: "Replace << >> with Greek guillemets",
        description: 'Turns "<<" into "«" and ">>" into "»".',
        example: "<<λέξη>> -> «λέξη»",
        cases: "<< and >>",
      },
      den_negation_trim: {
        title: 'Choose between contextual "δε" and global "δεν"',
        description:
          'Either applies the existing contextual trimming before selected consonants or normalizes all standalone "δε" forms to "δεν", based on your preference.',
        example: "δεν βγαίνω -> δε βγαίνω or δε μένω -> δεν μένω",
        cases:
          'Contextual trimming before selected consonants, or global standalone "δε/δεν" normalization to "δεν".',
      },
      akomi_to_akoma_before_kai: {
        title: 'Change "ακόμη" to "ακόμα" before "και/κι"',
        description: 'Turns "ακόμη" into "ακόμα" only when it is followed by "και" or "κι".',
        example: "ακόμη και -> ακόμα και",
        cases: "ακόμη και, ακόμη κι",
      },
      prin_na_to_protou: {
        title: 'Change "πριν να" to "προτού"',
        description: 'Turns the phrase "πριν να" into "προτού".',
        example: "πριν να φύγεις -> προτού φύγεις",
        cases: "The full phrase before a verb or clause.",
      },
      me_se_mena_sena_contract: {
        title: 'Contract "με/σε" before "μένα/σένα"',
        description:
          'Turns "με μένα", "με σένα", "σε μένα", and "σε σένα" into contracted forms with apostrophe.',
        example: "με σένα -> μ' εσένα",
        cases: "με μένα, με σένα, σε μένα, σε σένα",
      },
      prin_before_time_phrase: {
        title: 'Change "πριν" to "πριν από" before time and event phrases',
        description:
          'Turns "πριν" into "πριν από" when it is followed by specific time spans, meals, seasons, or common event phrases.',
        example: "πριν το μάθημα -> πριν από το μάθημα",
        cases:
          "το μάθημα, τη δουλειά, το ταξίδι, γεύματα, εποχές, ώρα, εβδομάδα/ες, χρόνος/χρόνια, μήνας/μήνες, numeric duration phrases",
      },
      question_pou_pos_toning: {
        title: 'Accent opening "που/πως" in direct questions',
        description:
          'Accents sentence-opening "που" and "πως" when the sentence ends with a Greek question mark and stays a single direct question.',
        example: "Που πήγες; -> Πού πήγες;",
        cases:
          "Sentence starts with που/πως and ends with ; without another full stop, exclamation mark, ellipsis, or upper dot.",
      },
      quote_comma_trim: {
        title: "Remove comma after closing guillemet",
        description: 'Removes the comma in the sequence "»,".',
        example: "«Γύρισα», -> «Γύρισα»",
        cases: 'Only the exact sequence "»,".',
      },
      mesa_sto_contract: {
        title: 'Contract "μέσα στο/στην/στον" to "μες ..."',
        description:
          'Turns "μέσα στο", "μέσα στην", and "μέσα στον" into the shorter literary forms.',
        example: "μέσα στην πόλη -> μες στην πόλη",
        cases: "μέσα στο, μέσα στην, μέσα στον",
      },
      kathe_enas_series: {
        title: 'Join "κάθε ένας/μία/ένα/έναν/τι" into one word',
        description:
          'Turns the split forms into the standard single-word forms such as "καθένας" and "καθεμία".',
        example: "κάθε ένας -> καθένας",
        cases: "κάθε ένας, κάθε μία, κάθε ένα, κάθε έναν, κάθε τι",
      },
      quote_period_preference: {
        title: "Choose whether the period stays inside or outside closing guillemets",
        description:
          "Moves the period to the preferred side of the closing guillemet using the option you choose below.",
        example: "«Γύρνα». -> «Γύρνα.» or the reverse",
        cases: 'Only the combinations ".»" and "».", according to your preference.',
      },
      theos_phrases_normalize: {
        title: 'Normalize fixed "Θεός" phrases',
        description:
          'Normalizes the phrases "δόξα τον Θεό" and "μα τω Θεώ" to the preferred fixed forms.',
        example: "δόξα τον Θεό -> δόξα τω Θεώ, μα τω Θεώ -> μα τον Θεό",
        cases: 'The fixed phrases "δόξα τον Θεό" and "μα τω Θεώ".',
      },
      comma_before_subordinators: {
        title: "Insert comma before common subordinators",
        description:
          "Adds a comma before common lowercase subordinators when they introduce a continuation inside the same sentence.",
        example: "έφυγα όταν νύχτωσε -> έφυγα, όταν νύχτωσε",
        cases:
          "για να, όταν, μέχρι, γιατί, επειδή, διότι, αν, άμα, εάν in lowercase and not at sentence start",
      },
      anamesa_article_contract: {
        title: 'Adjust article after "ανάμεσα ... και ..."',
        description:
          'Turns "και το/τον/τη/την ..." into "και στο/στον/στη/στην ..." after the pattern "ανάμεσα ... και ...".',
        example: "ανάμεσα στην πόλη και την θάλασσα -> ανάμεσα στην πόλη και στην θάλασσα",
        cases: "ανάμεσα σε/στο/στον/στη/στην ... και το/τον/τη/την ...",
      },
      sto_to_contract: {
        title: 'Change specific "στο ..." phrases to "σ\' το ..."',
        description:
          'Contracts the fixed phrases "στο είπα", "στο έδωσα", "στο έστειλα" and the rest of the selected list.',
        example: "στο είπα -> σ' το είπα",
        cases:
          "στο είπα, στο έδωσα, στο έστειλα, στο έγραψα, στο εξήγησα, στο έδειξα, στο ζήτησα, στο θύμισα, στο έφερα, στο είχα πει",
      },
      vromia_family_omicron: {
        title: 'Normalize the "βρομ-" family with omicron',
        description:
          "Normalizes common misspellings of the βρομιά / βρόμικος family that are written with omega.",
        example: "βρωμιά -> βρομιά, Βρώμικος -> Βρόμικος",
        cases: "βρωμιά, βρώμικος and related forms that start with βρωμ-/βρώμ-",
      },
      antikrizo_family_iota: {
        title: 'Normalize the "αντικρίζω" family with iota',
        description:
          "Normalizes common misspellings in derivatives of αντικρίζω that are written with upsilon.",
        example: "αντικρύζω -> αντικρίζω",
        cases: "Words that start with αντικρυ-/αντικρύ-",
      },
      klotso_family_omicron: {
        title: 'Normalize the "κλοτσ-" family with omicron',
        description:
          "Normalizes common misspellings of κλοτσώ derivatives that are written with omega in the first syllable.",
        example: "κλωτσάω -> κλοτσάω",
        cases: "Words that start with κλωτσ-/κλώτσ-",
      },
      skeptikos_family_normalize: {
        title: 'Normalize the "σκεπτικός" family',
        description:
          'Normalizes misspellings of "σκεπτικός" and its derivatives when they are written as "σκεφτηκ-" or "σκεφτικ-".',
        example: "σκεφτηκός -> σκεπτικός",
        cases: "σκεφτηκός, σκεφτική, σκεφτικοί and related forms",
      },
      andras_preference: {
        title: 'Choose the preferred form for "άντρας / άνδρας"',
        description:
          "Applies the preferred form you select to common singular and plural inflections of the word.",
        example: "άνδρας -> άντρας or άντρας -> άνδρας",
        cases: "άντρας, άντρα, άντρες, αντρών and άνδρας, άνδρα, άνδρες, ανδρών",
      },
      och_interjection_normalize: {
        title: 'Change "ωχ" to "οχ"',
        description: 'Turns the standalone word "ωχ" into "οχ".',
        example: "ωχ -> οχ",
        cases: 'The standalone interjection "ωχ".',
      },
      zilia_normalize: {
        title: 'Change "ζήλεια" to "ζήλια"',
        description: 'Turns the word "ζήλεια" into "ζήλια".',
        example: "ζήλεια -> ζήλια",
        cases: 'The standalone word "ζήλεια".',
      },
      ktirio_normalize: {
        title: 'Change "κτήριο" to "κτίριο"',
        description: 'Turns the word "κτήριο" into "κτίριο".',
        example: "κτήριο -> κτίριο",
        cases: 'The standalone word "κτήριο".',
      },
      etaireia_normalize: {
        title: 'Change "εταιρία" to "εταιρεία"',
        description: 'Turns the word "εταιρία" into "εταιρεία".',
        example: "εταιρία -> εταιρεία",
        cases: 'The standalone word "εταιρία".',
      },
      parolo_pou_normalize: {
        title: 'Change "παρ\' όλο που" to "παρόλο που"',
        description: 'Turns the phrase "παρ\' όλο που" into "παρόλο που".',
        example: "παρ' όλο που έφυγε -> παρόλο που έφυγε",
        cases: 'The full phrase "παρ\' όλο που".',
      },
      par_ola_auta_normalize: {
        title: 'Change "παρόλα αυτά" to "παρ\' όλα αυτά"',
        description: 'Turns the phrase "παρόλα αυτά" into "παρ\' όλα αυτά".',
        example: "παρόλα αυτά -> παρ' όλα αυτά",
        cases: 'The full phrase "παρόλα αυτά".',
      },
      parempiptontos_normalize: {
        title: 'Change "περεπιπτόντως" to "παρεμπιπτόντως"',
        description: 'Turns the word "περεπιπτόντως" into "παρεμπιπτόντως".',
        example: "περεπιπτόντως -> παρεμπιπτόντως",
        cases: 'The standalone word "περεπιπτόντως".',
      },
      syngnomi_normalize: {
        title: 'Change "συγνώμη" to "συγγνώμη"',
        description: 'Turns the word "συγνώμη" into "συγγνώμη".',
        example: "συγνώμη -> συγγνώμη",
        cases: 'The standalone word "συγνώμη".',
      },
      bira_normalize: {
        title: 'Change "μπύρα" to "μπίρα"',
        description: 'Turns the word "μπύρα" into "μπίρα".',
        example: "μπύρα -> μπίρα",
        cases: 'The standalone word "μπύρα".',
      },
      xidi_normalize: {
        title: 'Change "ξύδι" to "ξίδι"',
        description: 'Turns the word "ξύδι" into "ξίδι".',
        example: "ξύδι -> ξίδι",
        cases: 'The standalone word "ξύδι".',
      },
      avgo_preference: {
        title: 'Choose the preferred form for "αβγό / αυγό"',
        description:
          "Applies the preferred form you select to common singular and plural inflections of the word.",
        example: "αβγό -> αυγό or αυγό -> αβγό",
        cases: "αβγό, αβγά, αβγού, αβγών and αυγό, αυγά, αυγού, αυγών",
      },
      parti_normalize: {
        title: 'Change "πάρτυ" to "πάρτι"',
        description: 'Turns the word "πάρτυ" into "πάρτι".',
        example: "πάρτυ -> πάρτι",
        cases: 'The standalone word "πάρτυ".',
      },
      stil_normalize: {
        title: 'Change "στυλ" to "στιλ"',
        description: 'Turns the word "στυλ" into "στιλ".',
        example: "στυλ -> στιλ",
        cases: 'The standalone word "στυλ".',
      },
      xipolytos_normalize: {
        title: 'Change "ξυπόλητος" to "ξυπόλυτος"',
        description: 'Turns the word "ξυπόλητος" into "ξυπόλυτος".',
        example: "ξυπόλητος -> ξυπόλυτος",
        cases: 'The standalone word "ξυπόλητος".',
      },
      chronon_normalize: {
        title: 'Change "χρονών" to "χρόνων"',
        description: 'Turns the word "χρονών" into "χρόνων".',
        example: "είμαι δεκαοχτώ χρονών -> είμαι δεκαοχτώ χρόνων",
        cases: 'The standalone word "χρονών".',
      },
      xefysixe_normalize: {
        title: 'Normalize "φύσησε / ξεφύσησε" to the "φύσηξε / ξεφύσηξε" family',
        description:
          'Turns common forms of "φύσησε" and "ξεφύσησε" into the corresponding "φύσηξε / ξεφύσηξε" spellings.',
        example: "φύσησε -> φύσηξε, ξεφύσησαν -> ξεφύσηξαν",
        cases: "φύσησα, φύσησες, φύσησε, φύσησαν and ξεφύσησα, ξεφύσησες, ξεφύσησε, ξεφύσησαν",
      },
      me_mias_normalize: {
        title: 'Change "με μιας" to "μεμιάς"',
        description: 'Turns the phrase "με μιας" into "μεμιάς".',
        example: "με μιας -> μεμιάς",
        cases: 'The full phrase "με μιας".',
      },
      ex_archis_normalize: {
        title: 'Change "εξ αρχής" to "εξαρχής"',
        description: 'Turns the phrase "εξ αρχής" into "εξαρχής".',
        example: "εξ αρχής -> εξαρχής",
        cases: 'The full phrase "εξ αρχής".',
      },
      pou_kai_pou_toning: {
        title: 'Accent the fixed phrases "που και που" and "πως και πως"',
        description: 'Turns the fixed phrases into "πού και πού" and "πώς και πώς".',
        example: "που και που -> πού και πού",
        cases: 'The full phrases "που και που" and "πως και πως".',
      },
      colloquial_past_progressive_normalize: {
        title: 'Normalize common colloquial "-αγα" verb endings',
        description:
          "Normalizes common colloquial past progressive endings such as -αγα, -αγες, -αγε, -άγαμε, -άγατε, -άγαν(ε) into the -ούσα series.",
        example: "περπάταγα -> περπατούσα",
        cases: "-αγα, -αγες, -αγε, -άγαμε, -άγατε, -άγαν, -άγανε",
      },
      ok_uppercase: {
        title: 'Change "οκ" to "ΟΚ"',
        description: 'Turns the standalone word "οκ" into uppercase "ΟΚ".',
        example: "οκ -> ΟΚ",
        cases: 'The standalone word "οκ".',
      },
      siga_siga_spacing: {
        title: 'Change "σιγά-σιγά" to "σιγά σιγά"',
        description: 'Turns the phrase "σιγά-σιγά" into "σιγά σιγά".',
        example: "σιγά-σιγά -> σιγά σιγά",
        cases: 'The full phrase "σιγά-σιγά".',
      },
      cheri_cheri_spacing: {
        title: 'Change "χέρι-χέρι" to "χέρι χέρι"',
        description: 'Turns the phrase "χέρι-χέρι" into "χέρι χέρι".',
        example: "χέρι-χέρι -> χέρι χέρι",
        cases: 'The full phrase "χέρι-χέρι".',
      },
    },
  },
  el: {
    title: "Λογοτεχνική επιμέλεια ελληνικών βιβλίων",
    subtitle:
      "Εφαρμόστε επιλεγμένους κανόνες επιμέλειας σε χειρόγραφο Word ή σε επικολλημένο κείμενο.",
    inputMode: "Τρόπος εισόδου",
    modes: {
      docx: "Χειρόγραφο Word",
      text: "Επικόλληση κειμένου",
    },
    step1: "Βήμα 1: Επιλέξτε είσοδο",
    step2: "Βήμα 2: Διαλέξτε τις διορθώσεις που θα εφαρμοστούν",
    step3: "Βήμα 3: Επιλογές εξόδου",
    step4: "Βήμα 4: Εκτέλεση επιμέλειας",
    scopeNote:
      "Στη λειτουργία DOCX γίνεται επεξεργασία μόνο στο κύριο σώμα του χειρογράφου. Κεφαλίδες, υποσέλιδα, σημειώσεις, σχόλια και πλαίσια κειμένου μένουν όπως είναι.",
    textModeNote:
      "Η λειτουργία κειμένου επιστρέφει το διορθωμένο κείμενο κατευθείαν στη σελίδα για έλεγχο πριν από τη λήψη.",
    textPlaceholder: "Επικολλήστε εδώ το ελληνικό κείμενο που θέλετε να επιμεληθείτε.",
    selectedRules: "Επιλεγμένοι κανόνες: {count}",
    selectAllRules: "Εφαρμογή όλων των διαθέσιμων κανόνων",
    selectAllRulesHelp:
      "Ενεργοποιεί όλους τους κανόνες και στις δύο ενότητες. Μπορείτε μετά να αφαιρέσετε όποιους δεν θέλετε.",
    includeReport: "Να παραχθεί αναλυτικό report πριν/μετά",
    includeReportHelp:
      "Στη λειτουργία DOCX επιστρέφεται ZIP με το διορθωμένο χειρόγραφο και τα αρχεία report. Στη λειτουργία κειμένου το report εμφανίζεται παρακάτω και μπορείτε να το κατεβάσετε ως κείμενο.",
    apply: "Εφαρμογή επιλεγμένων διορθώσεων",
    applying: "Γίνεται εφαρμογή...",
    ready: "Το διορθωμένο χειρόγραφό σας είναι έτοιμο.",
    modalTitle: "Το διορθωμένο χειρόγραφο είναι έτοιμο",
    modalDescription: "Κατεβάστε το διορθωμένο αρχείο παρακάτω.",
    textResultTitle: "Διορθωμένο κείμενο",
    reportTitle: "Αναλυτικό report",
    reportOccurrences: "{count} αλλαγές",
    reportSentenceBefore: "Πρόταση πριν",
    reportSentenceAfter: "Πρόταση μετά",
    downloadCorrectedText: "Λήψη διορθωμένου κειμένου",
    downloadReport: "Λήψη report",
    reportStats: {
      totalChanges: "Συνολικές αλλαγές",
      rulesTouched: "Κανόνες που επηρέασαν το κείμενο",
      changedParagraphs: "Παράγραφοι που άλλαξαν",
    },
    ruleHelp: "Δείτε παράδειγμα και περιπτώσεις",
    exampleLabel: "Παράδειγμα",
    casesLabel: "Περιπτώσεις που επηρεάζονται",
    sections: {
      literary: {
        title: "Κανόνες λογοτεχνικής επιμέλειας",
        description: "Διορθώσεις για ροή, συντμήσεις, αποστάσεις και σημεία στίξης στο κείμενο.",
      },
      orthography: {
        title: "Συχνοί ορθογραφικοί κανόνες",
        description: "Συχνές ορθογραφικές κανονικοποιήσεις και διορθώσεις γραφής.",
      },
      preferences: {
        title: "Κανόνες πολλαπλών επιλογών",
        description: "Κανόνες όπου εφαρμόζεται η προτιμώμενη μορφή που επιλέγει ο χρήστης.",
      },
    },
    preferences: {
      denNegationStyle: {
        label: 'Προτιμώμενο ύφος για "δεν / δε"',
        options: {
          contextual: 'Χρήση συμφραστικού "δε"',
          alwaysDen: 'Πάντα "δεν"',
        },
      },
      andrasStyle: {
        label: 'Προτιμώμενη γραφή για "άντρας / άνδρας"',
        options: {
          antras: 'Προτίμηση στο "άντρας"',
          andras: 'Προτίμηση στο "άνδρας"',
        },
      },
      avgoStyle: {
        label: 'Προτιμώμενη γραφή για "αβγό / αυγό"',
        options: {
          avgo: 'Προτίμηση στο "αυγό"',
          avgoBeta: 'Προτίμηση στο "αβγό"',
        },
      },
      quotePeriodStyle: {
        label: "Προτιμώμενη θέση της τελείας σε σχέση με τα εισαγωγικά",
        options: {
          outside: 'Προτίμηση στο "»."',
          inside: 'Προτίμηση στο ".»"',
        },
      },
    },
    rules: {
      kai_before_vowel: {
        title: 'Αλλαγή του "και" σε "κι" πριν από φωνήεν',
        description:
          'Μετατρέπει το αυτόνομο "και" σε "κι" όταν η επόμενη ελληνική λέξη αρχίζει από φωνήεν, τονισμένο ή άτονο.',
        example: "και αγάπη -> κι αγάπη",
        cases: "και α..., και ε..., και η..., και ι..., και ο..., και υ..., και ω...",
      },
      stin_article_trim: {
        title: 'Σύντμηση του "(σ)την" πριν από συγκεκριμένα σύμφωνα',
        description:
          'Μετατρέπει το "στην" σε "στη" και το "την" σε "τη" πριν από β, γ, δ, ζ, θ, λ, μ, ν, ρ, σ, φ, χ, με εξαιρέσεις τα γγ, γκ, μπ και ντ.',
        example: "στην βροχή -> στη βροχή, την λάμψη -> τη λάμψη",
        cases: "β, γ, δ, ζ, θ, λ, μ, ν, ρ, σ, φ, χ εκτός από γγ, γκ, μπ, ντ",
      },
      min_negation_trim: {
        title: 'Σύντμηση του "μην" πριν από συγκεκριμένα σύμφωνα',
        description:
          'Μετατρέπει το "μην" σε "μη" πριν από β, γ, δ, ζ, θ, λ, μ, ν, ρ, σ, φ, χ, με εξαιρέσεις τα γγ, γκ, μπ και ντ.',
        example: "μην βγεις -> μη βγεις",
        cases: "β, γ, δ, ζ, θ, λ, μ, ν, ρ, σ, φ, χ εκτός από γγ, γκ, μπ, ντ",
      },
      sa_to_san: {
        title: 'Αλλαγή του αυτόνομου "σα" σε "σαν"',
        description: 'Μετατρέπει την αυτόνομη λέξη "σα" σε "σαν".',
        example: "σα λύκος -> σαν λύκος",
        cases: 'Μόνο η αυτόνομη λέξη και όχι μεγαλύτερες λέξεις όπως "σαλόνι".',
      },
      ellipsis_normalize: {
        title: "Κανονικοποίηση πολλών τελειών σε αποσιωπητικά",
        description:
          "Αντικαθιστά κάθε ακολουθία τεσσάρων ή περισσότερων τελειών με ακριβώς τρεις τελείες.",
        example: "Περίμενε..... -> Περίμενε...",
        cases: "...., ....., ...... -> ...",
      },
      multiple_spaces_normalize: {
        title: "Σύμπτυξη πολλαπλών κενών",
        description: "Μετατρέπει δύο ή περισσότερα διαδοχικά κενά σε ένα κενό.",
        example: "λέξη  λέξη -> λέξη λέξη",
        cases: "Κάθε ακολουθία από πολλά οριζόντια κενά μέσα στο κείμενο.",
      },
      guillemets_normalize: {
        title: "Αλλαγή των << >> σε ελληνικά εισαγωγικά",
        description: 'Μετατρέπει το "<<" σε "«" και το ">>" σε "»".',
        example: "<<λέξη>> -> «λέξη»",
        cases: "<< και >>",
      },
      den_negation_trim: {
        title: 'Επιλογή ανάμεσα σε συμφραστικό "δε" και καθολικό "δεν"',
        description:
          'Είτε εφαρμόζει την υπάρχουσα συμφραστική σύντμηση πριν από συγκεκριμένα σύμφωνα είτε κανονικοποιεί όλες τις αυτόνομες μορφές "δε" σε "δεν", ανάλογα με την προτίμησή σας.',
        example: "δεν βγαίνω -> δε βγαίνω ή δε μένω -> δεν μένω",
        cases:
          'Συμφραστική σύντμηση πριν από συγκεκριμένα σύμφωνα ή καθολική κανονικοποίηση των αυτόνομων "δε/δεν" σε "δεν".',
      },
      akomi_to_akoma_before_kai: {
        title: 'Αλλαγή του "ακόμη" σε "ακόμα" πριν από "και/κι"',
        description: 'Μετατρέπει το "ακόμη" σε "ακόμα" μόνο όταν ακολουθεί η λέξη "και" ή "κι".',
        example: "ακόμη και -> ακόμα και",
        cases: "ακόμη και, ακόμη κι",
      },
      prin_na_to_protou: {
        title: 'Αλλαγή της φράσης "πριν να" σε "προτού"',
        description: 'Μετατρέπει τη φράση "πριν να" σε "προτού".',
        example: "πριν να φύγεις -> προτού φύγεις",
        cases: 'Η πλήρης φράση "πριν να".',
      },
      me_se_mena_sena_contract: {
        title: 'Σύντμηση του "με/σε" πριν από "μένα/σένα"',
        description:
          'Μετατρέπει τα "με μένα", "με σένα", "σε μένα" και "σε σένα" στις αποστροφικές μορφές.',
        example: "με σένα -> μ' εσένα",
        cases: "με μένα, με σένα, σε μένα, σε σένα",
      },
      prin_before_time_phrase: {
        title: 'Αλλαγή του "πριν" σε "πριν από" πριν από χρονικές και θεματικές φράσεις',
        description:
          'Μετατρέπει το "πριν" σε "πριν από" όταν ακολουθούν συγκεκριμένες χρονικές διάρκειες, γεύματα, εποχές ή συχνές φράσεις γεγονότων.',
        example: "πριν το μάθημα -> πριν από το μάθημα",
        cases:
          "το μάθημα, τη δουλειά, το ταξίδι, γεύματα, εποχές, ώρα, εβδομάδα/ες, χρόνος/χρόνια, μήνας/μήνες και αριθμητικές διάρκειες",
      },
      question_pou_pos_toning: {
        title: 'Τονισμός του αρχικού "που/πως" σε ευθείες ερωτήσεις',
        description:
          'Τονίζει το αρχικό "που" και "πως" όταν η πρόταση κλείνει με ελληνικό ερωτηματικό και παραμένει μία ενιαία ευθεία ερώτηση.',
        example: "Που πήγες; -> Πού πήγες;",
        cases:
          "Πρόταση που ξεκινά με που/πως και τελειώνει σε ; χωρίς να παρεμβάλλεται τελεία, θαυμαστικό, αποσιωπητικά ή άνω τελεία",
      },
      quote_comma_trim: {
        title: "Αφαίρεση κόμματος μετά από κλείσιμο εισαγωγικών",
        description: 'Αφαιρεί το κόμμα στη μορφή "»,".',
        example: "«Γύρισα», -> «Γύρισα»",
        cases: 'Μόνο η ακριβής ακολουθία "»,".',
      },
      mesa_sto_contract: {
        title: 'Σύντμηση του "μέσα στο/στην/στον" σε "μες ..."',
        description:
          'Μετατρέπει τα "μέσα στο", "μέσα στην" και "μέσα στον" στις συντομότερες λογοτεχνικές μορφές.',
        example: "μέσα στην πόλη -> μες στην πόλη",
        cases: "μέσα στο, μέσα στην, μέσα στον",
      },
      kathe_enas_series: {
        title: 'Ένωση του "κάθε ένας/μία/ένα/έναν/τι" σε μία λέξη',
        description:
          'Μετατρέπει τις χωριστές μορφές στις καθιερωμένες ενιαίες μορφές όπως "καθένας" και "καθεμία".',
        example: "κάθε ένας -> καθένας",
        cases: "κάθε ένας, κάθε μία, κάθε ένα, κάθε έναν, κάθε τι",
      },
      quote_period_preference: {
        title: "Επιλογή θέσης της τελείας σε σχέση με τα κλείσιμο εισαγωγικά",
        description:
          "Μετακινεί την τελεία πριν ή μετά από το κλείσιμο των εισαγωγικών ανάλογα με την προτίμηση που επιλέγετε.",
        example: "«Γύρνα». -> «Γύρνα.» ή το αντίστροφο",
        cases: 'Μόνο οι ακολουθίες ".»" και "».", ανάλογα με την προτίμησή σας.',
      },
      theos_phrases_normalize: {
        title: 'Κανονικοποίηση σταθερών φράσεων με το "Θεός"',
        description:
          'Κανονικοποιεί τις φράσεις "δόξα τον Θεό" και "μα τω Θεώ" στις ζητούμενες σταθερές μορφές.',
        example: "δόξα τον Θεό -> δόξα τω Θεώ, μα τω Θεώ -> μα τον Θεό",
        cases: 'Οι σταθερές φράσεις "δόξα τον Θεό" και "μα τω Θεώ".',
      },
      comma_before_subordinators: {
        title: "Προσθήκη κόμματος πριν από συχνούς υποτακτικούς συνδέσμους",
        description:
          "Προσθέτει κόμμα πριν από συχνούς πεζούς υποτακτικούς συνδέσμους όταν συνεχίζουν την ίδια πρόταση.",
        example: "έφυγα όταν νύχτωσε -> έφυγα, όταν νύχτωσε",
        cases:
          "για να, όταν, μέχρι, γιατί, επειδή, διότι, αν, άμα, εάν με πεζά και όχι στην αρχή πρότασης",
      },
      anamesa_article_contract: {
        title: 'Προσαρμογή άρθρου μετά από το σχήμα "ανάμεσα ... και ..."',
        description:
          'Μετατρέπει το "και το/τον/τη/την ..." σε "και στο/στον/στη/στην ..." όταν προηγείται το μοτίβο "ανάμεσα ... και ...".',
        example: "ανάμεσα στην πόλη και την θάλασσα -> ανάμεσα στην πόλη και στην θάλασσα",
        cases: "ανάμεσα σε/στο/στον/στη/στην ... και το/τον/τη/την ...",
      },
      sto_to_contract: {
        title: 'Αλλαγή συγκεκριμένων φράσεων "στο ..." σε "σ\' το ..."',
        description:
          'Μετατρέπει τις σταθερές φράσεις "στο είπα", "στο έδωσα", "στο έστειλα" και τις υπόλοιπες επιλεγμένες περιπτώσεις.',
        example: "στο είπα -> σ' το είπα",
        cases:
          "στο είπα, στο έδωσα, στο έστειλα, στο έγραψα, στο εξήγησα, στο έδειξα, στο ζήτησα, στο θύμισα, στο έφερα, στο είχα πει",
      },
      vromia_family_omicron: {
        title: 'Κανονικοποίηση της οικογένειας "βρομ-" με όμικρον',
        description:
          "Κανονικοποιεί συχνά λάθη της οικογένειας βρομιά / βρόμικος όταν γράφονται με ωμέγα.",
        example: "βρωμιά -> βρομιά, Βρώμικος -> Βρόμικος",
        cases: "βρωμιά, βρώμικος και συγγενικές μορφές που αρχίζουν από βρωμ-/βρώμ-",
      },
      antikrizo_family_iota: {
        title: 'Κανονικοποίηση της οικογένειας "αντικρίζω" με γιώτα',
        description:
          "Κανονικοποιεί συχνά λάθη σε παράγωγες μορφές του αντικρίζω όταν γράφονται με ύψιλον.",
        example: "αντικρύζω -> αντικρίζω",
        cases: "Λέξεις που αρχίζουν από αντικρυ-/αντικρύ-",
      },
      klotso_family_omicron: {
        title: 'Κανονικοποίηση της οικογένειας "κλοτσ-" με όμικρον',
        description:
          "Κανονικοποιεί συχνά λάθη σε παράγωγες μορφές του κλοτσώ όταν η πρώτη συλλαβή γράφεται με ωμέγα.",
        example: "κλωτσάω -> κλοτσάω",
        cases: "Λέξεις που αρχίζουν από κλωτσ-/κλώτσ-",
      },
      skeptikos_family_normalize: {
        title: 'Κανονικοποίηση της οικογένειας "σκεπτικός"',
        description:
          'Κανονικοποιεί λάθη της λέξης "σκεπτικός" και των παραγώγων της όταν γράφονται ως "σκεφτηκ-" ή "σκεφτικ-".',
        example: "σκεφτηκός -> σκεπτικός",
        cases: "σκεφτηκός, σκεφτική, σκεφτικοί και συγγενικές μορφές",
      },
      andras_preference: {
        title: 'Επιλογή προτιμώμενης γραφής για "άντρας / άνδρας"',
        description: "Εφαρμόζει τη μορφή που επιλέγετε στις συνηθέστερες κλιτές μορφές της λέξης.",
        example: "άνδρας -> άντρας ή άντρας -> άνδρας",
        cases: "άντρας, άντρα, άντρες, αντρών και άνδρας, άνδρα, άνδρες, ανδρών",
      },
      och_interjection_normalize: {
        title: 'Αλλαγή του "ωχ" σε "οχ"',
        description: 'Μετατρέπει την αυτόνομη λέξη "ωχ" σε "οχ".',
        example: "ωχ -> οχ",
        cases: 'Η αυτόνομη επιφώνηση "ωχ".',
      },
      zilia_normalize: {
        title: 'Αλλαγή του "ζήλεια" σε "ζήλια"',
        description: 'Μετατρέπει τη λέξη "ζήλεια" σε "ζήλια".',
        example: "ζήλεια -> ζήλια",
        cases: 'Η αυτόνομη λέξη "ζήλεια".',
      },
      ktirio_normalize: {
        title: 'Αλλαγή του "κτήριο" σε "κτίριο"',
        description: 'Μετατρέπει τη λέξη "κτήριο" σε "κτίριο".',
        example: "κτήριο -> κτίριο",
        cases: 'Η αυτόνομη λέξη "κτήριο".',
      },
      etaireia_normalize: {
        title: 'Αλλαγή του "εταιρία" σε "εταιρεία"',
        description: 'Μετατρέπει τη λέξη "εταιρία" σε "εταιρεία".',
        example: "εταιρία -> εταιρεία",
        cases: 'Η αυτόνομη λέξη "εταιρία".',
      },
      parolo_pou_normalize: {
        title: 'Αλλαγή του "παρ\' όλο που" σε "παρόλο που"',
        description: 'Μετατρέπει τη φράση "παρ\' όλο που" σε "παρόλο που".',
        example: "παρ' όλο που έφυγε -> παρόλο που έφυγε",
        cases: 'Η πλήρης φράση "παρ\' όλο που".',
      },
      par_ola_auta_normalize: {
        title: 'Αλλαγή του "παρόλα αυτά" σε "παρ\' όλα αυτά"',
        description: 'Μετατρέπει τη φράση "παρόλα αυτά" σε "παρ\' όλα αυτά".',
        example: "παρόλα αυτά -> παρ' όλα αυτά",
        cases: 'Η πλήρης φράση "παρόλα αυτά".',
      },
      parempiptontos_normalize: {
        title: 'Αλλαγή του "περεπιπτόντως" σε "παρεμπιπτόντως"',
        description: 'Μετατρέπει τη λέξη "περεπιπτόντως" σε "παρεμπιπτόντως".',
        example: "περεπιπτόντως -> παρεμπιπτόντως",
        cases: 'Η αυτόνομη λέξη "περεπιπτόντως".',
      },
      syngnomi_normalize: {
        title: 'Αλλαγή του "συγνώμη" σε "συγγνώμη"',
        description: 'Μετατρέπει τη λέξη "συγνώμη" σε "συγγνώμη".',
        example: "συγνώμη -> συγγνώμη",
        cases: 'Η αυτόνομη λέξη "συγνώμη".',
      },
      bira_normalize: {
        title: 'Αλλαγή του "μπύρα" σε "μπίρα"',
        description: 'Μετατρέπει τη λέξη "μπύρα" σε "μπίρα".',
        example: "μπύρα -> μπίρα",
        cases: 'Η αυτόνομη λέξη "μπύρα".',
      },
      xidi_normalize: {
        title: 'Αλλαγή του "ξύδι" σε "ξίδι"',
        description: 'Μετατρέπει τη λέξη "ξύδι" σε "ξίδι".',
        example: "ξύδι -> ξίδι",
        cases: 'Η αυτόνομη λέξη "ξύδι".',
      },
      avgo_preference: {
        title: 'Επιλογή προτιμώμενης γραφής για "αβγό / αυγό"',
        description: "Εφαρμόζει τη μορφή που επιλέγετε στις συνηθέστερες κλιτές μορφές της λέξης.",
        example: "αβγό -> αυγό ή αυγό -> αβγό",
        cases: "αβγό, αβγά, αβγού, αβγών και αυγό, αυγά, αυγού, αυγών",
      },
      parti_normalize: {
        title: 'Αλλαγή του "πάρτυ" σε "πάρτι"',
        description: 'Μετατρέπει τη λέξη "πάρτυ" σε "πάρτι".',
        example: "πάρτυ -> πάρτι",
        cases: 'Η αυτόνομη λέξη "πάρτυ".',
      },
      stil_normalize: {
        title: 'Αλλαγή του "στυλ" σε "στιλ"',
        description: 'Μετατρέπει τη λέξη "στυλ" σε "στιλ".',
        example: "στυλ -> στιλ",
        cases: 'Η αυτόνομη λέξη "στυλ".',
      },
      xipolytos_normalize: {
        title: 'Αλλαγή του "ξυπόλητος" σε "ξυπόλυτος"',
        description: 'Μετατρέπει τη λέξη "ξυπόλητος" σε "ξυπόλυτος".',
        example: "ξυπόλητος -> ξυπόλυτος",
        cases: 'Η αυτόνομη λέξη "ξυπόλητος".',
      },
      chronon_normalize: {
        title: 'Αλλαγή του "χρονών" σε "χρόνων"',
        description: 'Μετατρέπει τη λέξη "χρονών" σε "χρόνων".',
        example: "είμαι δεκαοχτώ χρονών -> είμαι δεκαοχτώ χρόνων",
        cases: 'Η αυτόνομη λέξη "χρονών".',
      },
      xefysixe_normalize: {
        title: 'Κανονικοποίηση των "φύσησε / ξεφύσησε" στη σειρά "φύσηξε / ξεφύσηξε"',
        description:
          'Μετατρέπει συχνές μορφές των "φύσησε" και "ξεφύσησε" στις αντίστοιχες γραφές "φύσηξε / ξεφύσηξε".',
        example: "φύσησε -> φύσηξε, ξεφύσησαν -> ξεφύσηξαν",
        cases: "φύσησα, φύσησες, φύσησε, φύσησαν και ξεφύσησα, ξεφύσησες, ξεφύσησε, ξεφύσησαν",
      },
      me_mias_normalize: {
        title: 'Αλλαγή του "με μιας" σε "μεμιάς"',
        description: 'Μετατρέπει τη φράση "με μιας" σε "μεμιάς".',
        example: "με μιας -> μεμιάς",
        cases: 'Η πλήρης φράση "με μιας".',
      },
      ex_archis_normalize: {
        title: 'Αλλαγή του "εξ αρχής" σε "εξαρχής"',
        description: 'Μετατρέπει τη φράση "εξ αρχής" σε "εξαρχής".',
        example: "εξ αρχής -> εξαρχής",
        cases: 'Η πλήρης φράση "εξ αρχής".',
      },
      pou_kai_pou_toning: {
        title: 'Τονισμός των φράσεων "που και που" και "πως και πως"',
        description: 'Μετατρέπει τις σταθερές φράσεις σε "πού και πού" και "πώς και πώς".',
        example: "που και που -> πού και πού",
        cases: 'Οι πλήρεις φράσεις "που και που" και "πως και πως".',
      },
      colloquial_past_progressive_normalize: {
        title: 'Κανονικοποίηση κοινών ρηματικών καταλήξεων σε "-αγα"',
        description:
          "Κανονικοποιεί κοινές προφορικές καταλήξεις όπως -αγα, -αγες, -αγε, -άγαμε, -άγατε, -άγαν(ε) στη σειρά -ούσα.",
        example: "περπάταγα -> περπατούσα",
        cases: "-αγα, -αγες, -αγε, -άγαμε, -άγατε, -άγαν, -άγανε",
      },
      ok_uppercase: {
        title: 'Αλλαγή του "οκ" σε "ΟΚ"',
        description: 'Μετατρέπει την αυτόνομη λέξη "οκ" σε κεφαλαίο "ΟΚ".',
        example: "οκ -> ΟΚ",
        cases: 'Η αυτόνομη λέξη "οκ".',
      },
      siga_siga_spacing: {
        title: 'Αλλαγή του "σιγά-σιγά" σε "σιγά σιγά"',
        description: 'Μετατρέπει τη φράση "σιγά-σιγά" σε "σιγά σιγά".',
        example: "σιγά-σιγά -> σιγά σιγά",
        cases: 'Η πλήρης φράση "σιγά-σιγά".',
      },
      cheri_cheri_spacing: {
        title: 'Αλλαγή του "χέρι-χέρι" σε "χέρι χέρι"',
        description: 'Μετατρέπει τη φράση "χέρι-χέρι" σε "χέρι χέρι".',
        example: "χέρι-χέρι -> χέρι χέρι",
        cases: 'Η πλήρης φράση "χέρι-χέρι".',
      },
    },
  },
};
