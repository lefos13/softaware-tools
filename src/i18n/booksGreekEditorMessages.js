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
      eptaStyle: {
        label: 'Preferred form for "επτά / εφτά"',
        options: {
          epta: 'Prefer "επτά"',
          efta: 'Prefer "εφτά"',
        },
      },
      oktoStyle: {
        label: 'Preferred form for "οκτώ / οχτώ"',
        options: {
          okto: 'Prefer "οκτώ"',
          oxto: 'Prefer "οχτώ"',
        },
      },
      enniaStyle: {
        label: 'Preferred form for "εννιά / εννέα"',
        options: {
          ennia: 'Prefer "εννιά"',
          ennea: 'Prefer "εννέα"',
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
          'Turns "στην" into "στη" and "την" into "τη" before β, γ, δ, ζ, θ, λ, μ, ν, ρ, σ, φ, χ, excluding γγ, γκ, μπ, ντ, and also adjusts "αυτή/αυτήν την/τη" depending on the next word.',
        example:
          "στην βροχή -> στη βροχή, αυτή τη μπάλα -> αυτή την μπάλα, αυτή την καρέκλα -> αυτήν τη καρέκλα",
        cases:
          'β, γ, δ, ζ, θ, λ, μ, ν, ρ, σ, φ, χ except γγ, γκ, μπ, ντ, plus "αυτή/αυτήν + την/τη" before γκ, μπ, ντ, ξ, ψ, vowels, or any other letter.',
      },
      min_negation_trim: {
        title: 'Normalize "μη / μην" by the following sound',
        description:
          'Keeps or turns the negation into "μην" before γκ, γγ, ντ, μπ, κ, π, τ, ξ, ψ, and vowels, and uses bare "μη" in other cases.',
        example: "μη γκρινιάζεις -> μην γκρινιάζεις, μην βγεις -> μη βγεις",
        cases: "μην before γκ, γγ, ντ, μπ, κ, π, τ, ξ, ψ and vowels; μη in other cases.",
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
      comma_space_normalize: {
        title: "Insert a space after commas",
        description:
          "Adds a missing space after each comma when the next character starts immediately after it.",
        example: "λέξη,λέξη -> λέξη, λέξη",
        cases: "Any comma not already followed by whitespace.",
      },
      period_space_normalize: {
        title: "Insert a space after sentence-ending periods",
        description:
          'Adds a missing space after a full stop, except when the next character is the closing guillemet "»". Decimal numbers stay unchanged.',
        example: "Τέλος.Ύστερα -> Τέλος. Ύστερα",
        cases:
          'Any full stop not already followed by whitespace, end of text, "»", or the next digit in a decimal number.',
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
        description:
          "Removes the comma when it appears immediately before or after a closing guillemet.",
        example: "«Γύρισα», -> «Γύρισα», «γύρνα,» -> «γύρνα»",
        cases: 'The exact sequences "»," and ",»".',
      },
      kyriarx_no_hyphen: {
        title: 'Remove the hyphen from "κυρ-", "πάτερ-", and "καπετάν-"',
        description:
          'Turns hyphenated forms such as "κυρ-Αλέξης" into the spaced forms "κυρ Αλέξης".',
        example: "κυρ-Αλέξης -> κυρ Αλέξης",
        cases: "κυρ-..., πάτερ-..., καπετάν-... before a following Greek word",
      },
      nobility_titles_lowercase: {
        title: "Lowercase nobility titles away from sentence start",
        description:
          "Keeps nobility titles capitalized only at the beginning of a sentence and lowercases them elsewhere.",
        example: "Ο Λόρδος μίλησε με τη Βασίλισσα. -> Ο λόρδος μίλησε με τη βασίλισσα.",
        cases:
          "λόρδος, λαίδη, πρίγκιπας, πριγκίπισσα, βασιλιάς, βασίλισσα, δούκας, δούκισσα, βαρόνος, βαρόνη, υποκόμης, υποκόμισσα, μαρκήσιος, μαρκησία",
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
          'Turns the second article into the matching "στ-" form after compact patterns such as "ανάμεσα στην πόλη και την θάλασσα" or "ανάμεσα σε φίλους και τους γείτονες".',
        example:
          "ανάμεσα στην πόλη και την θάλασσα -> ανάμεσα στην πόλη και στην θάλασσα, ανάμεσα σε φίλους και τους γείτονες -> ανάμεσα σε φίλους και στους γείτονες",
        cases:
          "ανάμεσα στο/στον/στη/στην <μία λέξη> και το/τον/τη/την/τους/τα/τις <λέξη>, ή ανάμεσα σε <μία λέξη με ή χωρίς άρθρο> και το/τον/τη/την/τους/τα/τις <λέξη>",
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
      tromaktikos_family_normalize: {
        title: 'Normalize the "τρομακτικός" family',
        description: 'Normalizes forms written as "τρομαχτ-" into the preferred "τρομακτ-" family.',
        example: "τρομαχτικό -> τρομακτικό",
        cases: "τρομαχτικό, τρομαχτική and related forms",
      },
      dachtyla_family_normalize: {
        title: 'Normalize the "δάχτυλα" family',
        description:
          'Normalizes only the inflections of "δάχτυλο" and "δαχτυλίδι" when they are written with "δακτυλ-".',
        example: "δάκτυλα -> δάχτυλα, δακτυλίδι -> δαχτυλίδι",
        cases: "δάκτυλο/δάχτυλο, δάκτυλα/δάχτυλα, δακτυλίδι/δαχτυλίδι and their inflections only.",
      },
      nychta_family_normalize: {
        title: 'Normalize the "νύχτα" family',
        description:
          'Normalizes forms written with "νύκτ-/νυκτ-" into the preferred "νύχτ-/νυχτ-" family.',
        example: "νύκτα -> νύχτα",
        cases: "νύκτα, νυκτερινός and related forms",
      },
      niotho_family_normalize: {
        title: 'Normalize the "νοιώθω" family',
        description:
          'Normalizes forms written as "νιώθ-" or "νιώσ-" into the preferred "νοιώθ-/νοιώσ-" family.',
        example: "Νιώθω -> Νοιώθω",
        cases: "Νιώθω, νιώσαμε and related forms",
      },
      dechtika_family_normalize: {
        title: 'Normalize the "δέχτηκα" family',
        description:
          'Normalizes "δέχθηκα", "παραδέχθηκα", and "αποδέχθηκα" families into their "δέχτηκα / παραδέχτηκα / απόδεχτηκα" forms.',
        example: "δέχθηκα -> δέχτηκα, αποδέχθηκαν -> απόδεχτηκαν",
        cases: "δέχθηκα..., παραδέχθηκα..., αποδέχθηκα... and related forms",
      },
      fos_normalize: {
        title: 'Normalize "φώς" to "φως"',
        description: 'Removes the incorrect accent from the standalone word "φώς".',
        example: "φώς -> φως",
        cases: 'The standalone word "φώς".',
      },
      apo_tonos_normalize: {
        title: 'Normalize "απο" to "από"',
        description: 'Adds the expected accent to the standalone preposition "απο".',
        example: "απο μένα -> από μένα",
        cases: 'The standalone word "απο".',
      },
      poios_family_tonos_normalize: {
        title: 'Remove the accent from selected "ποιο-" forms',
        description:
          'Normalizes accented forms such as "ποιό" and "ποιός" to the monotonic spellings without accent.',
        example: "ποιός -> ποιος",
        cases: "ποιό, ποιός, ποιά, ποιού, ποιάς",
      },
      mia_tonos_normalize: {
        title: 'Normalize "μιά" to "μια"',
        description: 'Removes the accent from the standalone word "μιά".',
        example: "μιά φορά -> μια φορά",
        cases: 'The standalone word "μιά".',
      },
      dyo_tonos_normalize: {
        title: 'Normalize "δυό" to "δυο"',
        description: 'Removes the accent from the standalone word "δυό".',
        example: "δυό μέρες -> δυο μέρες",
        cases: 'The standalone word "δυό".',
      },
      ti_tonos_normalize: {
        title: 'Normalize "τί" to "τι"',
        description: 'Removes the accent from the standalone word "τί".',
        example: "τί λες -> τι λες",
        cases: 'The standalone word "τί".',
      },
      pio_family_tonos_normalize: {
        title: 'Remove the accent from selected "πιω" forms',
        description:
          'Normalizes accented forms of "πιω" and selected inflections to the spellings without accent.',
        example: "πιώ -> πιω, πιούν -> πιουν",
        cases: "πιώ, πιείς, πιεί, πιούν",
      },
      mpas_normalize: {
        title: 'Normalize "μπάς" to "μπας"',
        description: 'Removes the accent from the standalone word "μπάς".',
        example: "μπάς και -> μπας και",
        cases: 'The standalone word "μπάς".',
      },
      gios_family_tonos_normalize: {
        title: 'Remove the accent from selected "γιος" forms',
        description:
          'Normalizes accented forms of "γιος" and selected inflections to the spellings without accent.',
        example: "γιός -> γιος, γιών -> γιων",
        cases: "γιός, γιό, γιοί, γιών",
      },
      nai_tonos_normalize: {
        title: 'Normalize "ναί" to "ναι"',
        description: 'Removes the accent from the standalone word "ναί".',
        example: "ναί -> ναι",
        cases: 'The standalone word "ναί".',
      },
      thes_tonos_normalize: {
        title: 'Normalize "θές" to "θες"',
        description: 'Removes the accent from the standalone word "θές".',
        example: "θές να δεις -> θες να δεις",
        cases: 'The standalone word "θές".',
      },
      op_interjection_normalize: {
        title: 'Normalize "ωπ" to "οπ"',
        description: 'Turns the interjection "ωπ" into the preferred form "οπ".',
        example: "ωπ -> οπ",
        cases: 'The standalone interjection "ωπ".',
      },
      andras_preference: {
        title: 'Choose the preferred form for "άντρας / άνδρας"',
        description:
          "Applies the preferred form you select to common singular and plural inflections of the word.",
        example: "άνδρας -> άντρας or άντρας -> άνδρας",
        cases: "άντρας, άντρα, άντρες, αντρών and άνδρας, άνδρα, άνδρες, ανδρών",
      },
      epta_preference: {
        title: 'Choose the preferred form for "επτά / εφτά"',
        description:
          "Applies the number form you prefer wherever these variants appear as standalone words.",
        example: "εφτά -> επτά or επτά -> εφτά",
        cases: 'The standalone words "επτά" and "εφτά".',
      },
      okto_preference: {
        title: 'Choose the preferred form for "οκτώ / οχτώ"',
        description:
          "Applies the number form you prefer wherever these variants appear as standalone words.",
        example: "οχτώ -> οκτώ or οκτώ -> οχτώ",
        cases: 'The standalone words "οκτώ" and "οχτώ".',
      },
      ennia_preference: {
        title: 'Choose the preferred form for "εννιά / εννέα"',
        description:
          "Applies the number form you prefer wherever these variants appear as standalone words.",
        example: "εννέα -> εννιά or εννιά -> εννέα",
        cases: 'The standalone words "εννιά" and "εννέα".',
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
      oson_afora_normalize: {
        title: 'Change "όσο αναφορά" to "όσον αφορά"',
        description: 'Turns the phrase "όσο αναφορά" into "όσον αφορά".',
        example: "όσο αναφορά το θέμα -> όσον αφορά το θέμα",
        cases: 'The full phrase "όσο αναφορά".',
      },
      ap_oti_normalize: {
        title: 'Change "απ\' ότι" to "απ\' ό,τι"',
        description: 'Turns the phrase "απ\' ότι" into "απ\' ό,τι".',
        example: "απ' ότι ξέρω -> απ' ό,τι ξέρω",
        cases: 'The full phrase "απ\' ότι".',
      },
      ypopsi_normalize: {
        title: 'Normalize "υπόψιν / υπ\' όψιν" to "υπόψη"',
        description: 'Turns "υπόψιν" and "υπ\' όψιν" into "υπόψη".',
        example: "υπ' όψιν -> υπόψη",
        cases: "υπόψιν, υπ' όψιν",
      },
      sintrivani_normalize: {
        title: 'Change "συντριβάνι" to "σιντριβάνι"',
        description: 'Turns the word "συντριβάνι" into "σιντριβάνι".',
        example: "συντριβάνι -> σιντριβάνι",
        cases: 'The standalone word "συντριβάνι".',
      },
      en_telei_normalize: {
        title: 'Change "εν τέλη" to "εντέλει"',
        description: 'Turns the phrase "εν τέλη" into "εντέλει".',
        example: "εν τέλη -> εντέλει",
        cases: 'The full phrase "εν τέλη".',
      },
      en_merei_normalize: {
        title: 'Change "εν μέρη" to "εν μέρει"',
        description: 'Turns the phrase "εν μέρη" into "εν μέρει".',
        example: "εν μέρη -> εν μέρει",
        cases: 'The full phrase "εν μέρη".',
      },
      haha_spacing_normalize: {
        title: 'Normalize "χαχα" to "χα, χα"',
        description: 'Turns the compact laughter form "χαχα" into the punctuated form "χα, χα".',
        example: "χαχα -> χα, χα",
        cases: 'The standalone word "χαχα".',
      },
      popo_normalize: {
        title: 'Normalize "πω πω / πωπω" to "ποπό"',
        description: 'Turns the interjection forms "πω πω", "πωπω", and "πωπωω" into "ποπό".',
        example: "πω πω -> ποπό",
        cases: "πω πω, πωπω, πωπωω and close variants of the same interjection",
      },
      dei_family_tonos_normalize: {
        title: 'Remove the accent from selected "δει" forms',
        description:
          'Normalizes forms such as "δεί", "δείς", and "δούν" to the spellings without accent.',
        example: "δείς -> δεις, δούν -> δουν",
        cases: "δεί, δείς, δούν",
      },
      chairetisa_family_normalize: {
        title: 'Normalize the "χαιρέτησα" family',
        description:
          'Turns selected past-tense forms written with "-τισ-" into the preferred family with "-τησ-".',
        example: "χαιρέτισα -> χαιρέτησα",
        cases: "χαιρέτισα, χαιρέτισες, χαιρέτισε, χαιρετίσαμε, χαιρετίσατε, χαιρέτισαν",
      },
      xtes_family_normalize: {
        title: 'Normalize "(προ)χθές / χτές" to "(προ)χτες"',
        description:
          'Turns the selected variants with theta or accented tau into the preferred forms with plain "χτες".',
        example: "χθές -> χτες, προχθές -> προχτές",
        cases: "χθές, χτές, προχθές",
      },
      geia_tonos_normalize: {
        title: 'Normalize "γειά" to "γεια"',
        description: 'Removes the accent from the standalone word "γειά".',
        example: "γειά σου -> γεια σου",
        cases: 'The standalone word "γειά".',
      },
      mov_normalize: {
        title: 'Normalize "μωβ / μώβ" to "μοβ"',
        description: 'Turns "μωβ" and its accented variant into the preferred form "μοβ".',
        example: "μώβ -> μοβ",
        cases: "μωβ, μώβ",
      },
      antepexerxomai_normalize: {
        title: 'Normalize the "αντεπεξέρχομαι" family',
        description:
          'Normalizes derivatives written as "ανταπεξ-" into the standard "αντεπεξ-" family.',
        example: "ανταπεξέρχομαι -> αντεπεξέρχομαι",
        cases: "ανταπεξέρχομαι, ανταπεξήλθα and related forms",
      },
      apathanatizo_normalize: {
        title: 'Normalize the "απαθανατίζω" family',
        description:
          'Normalizes derivatives written as "αποθανατ-" into the standard "απαθανατ-" family.',
        example: "αποθανατίζω -> απαθανατίζω",
        cases: "αποθανατίζω, αποθανατίστηκε and related forms",
      },
      zaploutos_normalize: {
        title: 'Change "ζάμπλουτος" to "ζάπλουτος"',
        description: 'Turns the word "ζάμπλουτος" into "ζάπλουτος".',
        example: "ζάμπλουτος -> ζάπλουτος",
        cases: 'The standalone word "ζάμπλουτος".',
      },
      synonthylevma_normalize: {
        title: 'Change "συνοθύλευμα" to "συνονθύλευμα"',
        description: 'Turns the word "συνοθύλευμα" into "συνονθύλευμα".',
        example: "συνοθύλευμα -> συνονθύλευμα",
        cases: 'The standalone word "συνοθύλευμα".',
      },
      myes_normalize: {
        title: 'Normalize "μύες / μυς" in the requested article patterns',
        description:
          'Turns "τους μύες" into "τους μυς", "οι μυς" into "οι μύες", and also rewrites "τους <λέξη> μύες" to "τους <λέξη> μυς".',
        example: "τους μεγάλους μύες -> τους μεγάλους μυς",
        cases: "τους μύες, οι μυς, τους <λέξη> μύες",
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
      fixed_hyphenated_phrases_normalize: {
        title: "Hyphenate fixed paired expressions",
        description:
          'Turns common paired expressions into their hyphenated forms, such as "πρωί-βράδυ" and "άψε-σβήσε".',
        example: "πρωί βράδυ -> πρωί-βράδυ",
        cases: "πρωί βράδυ, μέρα νύχτα, άψε σβήσε, πέρα δώθε",
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
      eptaStyle: {
        label: 'Προτιμώμενη γραφή για "επτά / εφτά"',
        options: {
          epta: 'Προτίμηση στο "επτά"',
          efta: 'Προτίμηση στο "εφτά"',
        },
      },
      oktoStyle: {
        label: 'Προτιμώμενη γραφή για "οκτώ / οχτώ"',
        options: {
          okto: 'Προτίμηση στο "οκτώ"',
          oxto: 'Προτίμηση στο "οχτώ"',
        },
      },
      enniaStyle: {
        label: 'Προτιμώμενη γραφή για "εννιά / εννέα"',
        options: {
          ennia: 'Προτίμηση στο "εννιά"',
          ennea: 'Προτίμηση στο "εννέα"',
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
          'Μετατρέπει το "στην" σε "στη" και το "την" σε "τη" πριν από β, γ, δ, ζ, θ, λ, μ, ν, ρ, σ, φ, χ, με εξαιρέσεις τα γγ, γκ, μπ και ντ, και παράλληλα ρυθμίζει και το "αυτή/αυτήν την/τη" ανάλογα με την επόμενη λέξη.',
        example:
          "στην βροχή -> στη βροχή, αυτή τη μπάλα -> αυτή την μπάλα, αυτή την καρέκλα -> αυτήν τη καρέκλα",
        cases:
          'β, γ, δ, ζ, θ, λ, μ, ν, ρ, σ, φ, χ εκτός από γγ, γκ, μπ, ντ, καθώς και "αυτή/αυτήν + την/τη" πριν από γκ, μπ, ντ, ξ, ψ, φωνήεν ή οποιοδήποτε άλλο γράμμα.',
      },
      min_negation_trim: {
        title: 'Κανονικοποίηση του "μη / μην" ανάλογα με τον επόμενο φθόγγο',
        description:
          'Κρατά ή μετατρέπει την άρνηση σε "μην" πριν από γκ, γγ, ντ, μπ, κ, π, τ, ξ, ψ και φωνήεντα, και χρησιμοποιεί σκέτο "μη" σε κάθε άλλη περίπτωση.',
        example: "μη γκρινιάζεις -> μην γκρινιάζεις, μην βγεις -> μη βγεις",
        cases:
          "μην πριν από γκ, γγ, ντ, μπ, κ, π, τ, ξ, ψ και φωνήεντα· μη σε όλες τις άλλες περιπτώσεις.",
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
      comma_space_normalize: {
        title: "Προσθήκη κενού μετά από κόμμα",
        description:
          "Προσθέτει το κενό που λείπει μετά από κάθε κόμμα όταν η επόμενη λέξη ξεκινά αμέσως μετά.",
        example: "λέξη,λέξη -> λέξη, λέξη",
        cases: "Κάθε κόμμα που δεν ακολουθείται ήδη από κενό.",
      },
      period_space_normalize: {
        title: "Προσθήκη κενού μετά από τελεία στο τέλος πρότασης",
        description:
          'Προσθέτει το κενό που λείπει μετά από τελεία, εκτός αν ακολουθεί το κλείσιμο εισαγωγικών "»". Οι δεκαδικοί αριθμοί μένουν ανέπαφοι.',
        example: "Τέλος.Ύστερα -> Τέλος. Ύστερα",
        cases:
          'Κάθε τελεία που δεν ακολουθείται ήδη από κενό, τέλος κειμένου, "»" ή το επόμενο ψηφίο δεκαδικού αριθμού.',
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
        description:
          "Αφαιρεί το κόμμα όταν βρίσκεται αμέσως πριν ή αμέσως μετά από κλείσιμο εισαγωγικών.",
        example: "«Γύρισα», -> «Γύρισα», «γύρνα,» -> «γύρνα»",
        cases: 'Οι ακριβείς ακολουθίες "»," και ",»".',
      },
      kyriarx_no_hyphen: {
        title: 'Αφαίρεση της ενωτικής παύλας από τα "κυρ-", "πάτερ-", "καπετάν-"',
        description:
          'Μετατρέπει υβριδικές μορφές όπως "κυρ-Αλέξης" στις μορφές με κενό, όπως "κυρ Αλέξης".',
        example: "κυρ-Αλέξης -> κυρ Αλέξης",
        cases: "κυρ-..., πάτερ-..., καπετάν-... πριν από επόμενη ελληνική λέξη",
      },
      nobility_titles_lowercase: {
        title: "Πεζοποίηση των τίτλων ευγενείας εκτός αρχής πρότασης",
        description:
          "Κρατά τους τίτλους ευγενείας με κεφαλαίο μόνο στην αρχή πρότασης και τους κάνει πεζούς σε κάθε άλλη θέση.",
        example: "Ο Λόρδος μίλησε με τη Βασίλισσα. -> Ο λόρδος μίλησε με τη βασίλισσα.",
        cases:
          "λόρδος, λαίδη, πρίγκιπας, πριγκίπισσα, βασιλιάς, βασίλισσα, δούκας, δούκισσα, βαρόνος, βαρόνη, υποκόμης, υποκόμισσα, μαρκήσιος, μαρκησία",
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
          'Μετατρέπει το δεύτερο άρθρο στην αντίστοιχη μορφή με "στ-" όταν προηγούνται σύντομα σχήματα όπως "ανάμεσα στην πόλη και την θάλασσα" ή "ανάμεσα σε φίλους και τους γείτονες".',
        example:
          "ανάμεσα στην πόλη και την θάλασσα -> ανάμεσα στην πόλη και στην θάλασσα, ανάμεσα σε φίλους και τους γείτονες -> ανάμεσα σε φίλους και στους γείτονες",
        cases:
          "ανάμεσα στο/στον/στη/στην <μία λέξη> και το/τον/τη/την/τους/τα/τις <λέξη>, ή ανάμεσα σε <μία λέξη με ή χωρίς άρθρο> και το/τον/τη/την/τους/τα/τις <λέξη>",
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
      tromaktikos_family_normalize: {
        title: 'Κανονικοποίηση της οικογένειας "τρομακτικός"',
        description:
          'Κανονικοποιεί μορφές που γράφονται ως "τρομαχτ-" στην προτιμώμενη οικογένεια "τρομακτ-".',
        example: "τρομαχτικό -> τρομακτικό",
        cases: "τρομαχτικό, τρομαχτική και συγγενικές μορφές",
      },
      dachtyla_family_normalize: {
        title: 'Κανονικοποίηση της οικογένειας "δάχτυλα"',
        description:
          'Κανονικοποιεί μόνο τις πτώσεις του "δάχτυλο" και του "δαχτυλίδι" όταν γράφονται με "δακτυλ-".',
        example: "δάκτυλα -> δάχτυλα, δακτυλίδι -> δαχτυλίδι",
        cases: "δάκτυλο/δάχτυλο, δάκτυλα/δάχτυλα, δακτυλίδι/δαχτυλίδι και μόνο οι πτώσεις τους.",
      },
      nychta_family_normalize: {
        title: 'Κανονικοποίηση της οικογένειας "νύχτα"',
        description:
          'Κανονικοποιεί μορφές που γράφονται με "νύκτ-/νυκτ-" στην προτιμώμενη οικογένεια "νύχτ-/νυχτ-", με εξαίρεση τη σταθερή φράση "κρέμα νυκτός".',
        example: "νύκτα -> νύχτα",
        cases: "νύκτα, νυκτερινός και συγγενικές μορφές, εκτός από τη φράση «κρέμα νυκτός»",
      },
      niotho_family_normalize: {
        title: 'Κανονικοποίηση της οικογένειας "νοιώθω"',
        description:
          'Κανονικοποιεί μορφές που γράφονται ως "νιώθ-" ή "νιώσ-" στην προτιμώμενη οικογένεια "νοιώθ-/νοιώσ-".',
        example: "Νιώθω -> Νοιώθω",
        cases: "Νιώθω, νιώσαμε και συγγενικές μορφές",
      },
      dechtika_family_normalize: {
        title: 'Κανονικοποίηση της οικογένειας "δέχτηκα"',
        description:
          'Κανονικοποιεί τις οικογένειες "δέχθηκα", "παραδέχθηκα" και "αποδέχθηκα" στις μορφές "δέχτηκα / παραδέχτηκα / απόδεχτηκα".',
        example: "δέχθηκα -> δέχτηκα, αποδέχθηκαν -> απόδεχτηκαν",
        cases: "δέχθηκα..., παραδέχθηκα..., αποδέχθηκα... και συγγενικές μορφές",
      },
      fos_normalize: {
        title: 'Κανονικοποίηση του "φώς" σε "φως"',
        description: 'Αφαιρεί τον λανθασμένο τόνο από την αυτόνομη λέξη "φώς".',
        example: "φώς -> φως",
        cases: 'Το αυτόνομο "φώς".',
      },
      apo_tonos_normalize: {
        title: 'Κανονικοποίηση του "απο" σε "από"',
        description: 'Προσθέτει τον αναμενόμενο τόνο στην αυτόνομη πρόθεση "απο".',
        example: "απο μένα -> από μένα",
        cases: 'Το αυτόνομο "απο".',
      },
      poios_family_tonos_normalize: {
        title: 'Αφαίρεση του τόνου από επιλεγμένες μορφές του "ποιο-"',
        description:
          'Κανονικοποιεί τονισμένες μορφές όπως "ποιό" και "ποιός" στις μονοτονικές γραφές χωρίς τόνο.',
        example: "ποιός -> ποιος",
        cases: "ποιό, ποιός, ποιά, ποιού, ποιάς",
      },
      mia_tonos_normalize: {
        title: 'Κανονικοποίηση του "μιά" σε "μια"',
        description: 'Αφαιρεί τον τόνο από την αυτόνομη λέξη "μιά".',
        example: "μιά φορά -> μια φορά",
        cases: 'Το αυτόνομο "μιά".',
      },
      dyo_tonos_normalize: {
        title: 'Κανονικοποίηση του "δυό" σε "δυο"',
        description: 'Αφαιρεί τον τόνο από την αυτόνομη λέξη "δυό".',
        example: "δυό μέρες -> δυο μέρες",
        cases: 'Το αυτόνομο "δυό".',
      },
      ti_tonos_normalize: {
        title: 'Κανονικοποίηση του "τί" σε "τι"',
        description: 'Αφαιρεί τον τόνο από την αυτόνομη λέξη "τί".',
        example: "τί λες -> τι λες",
        cases: 'Το αυτόνομο "τί".',
      },
      pio_family_tonos_normalize: {
        title: 'Αφαίρεση του τόνου από επιλεγμένες μορφές του "πιω"',
        description:
          'Κανονικοποιεί τονισμένες μορφές του "πιω" και επιλεγμένων κλίσεών του στις γραφές χωρίς τόνο.',
        example: "πιώ -> πιω, πιούν -> πιουν",
        cases: "πιώ, πιείς, πιεί, πιούν",
      },
      mpas_normalize: {
        title: 'Κανονικοποίηση του "μπάς" σε "μπας"',
        description: 'Αφαιρεί τον τόνο από την αυτόνομη λέξη "μπάς".',
        example: "μπάς και -> μπας και",
        cases: 'Το αυτόνομο "μπάς".',
      },
      gios_family_tonos_normalize: {
        title: 'Αφαίρεση του τόνου από επιλεγμένες μορφές του "γιος"',
        description:
          'Κανονικοποιεί τονισμένες μορφές του "γιος" και επιλεγμένων κλίσεών του στις γραφές χωρίς τόνο.',
        example: "γιός -> γιος, γιών -> γιων",
        cases: "γιός, γιό, γιοί, γιών",
      },
      nai_tonos_normalize: {
        title: 'Κανονικοποίηση του "ναί" σε "ναι"',
        description: 'Αφαιρεί τον τόνο από την αυτόνομη λέξη "ναί".',
        example: "ναί -> ναι",
        cases: 'Το αυτόνομο "ναί".',
      },
      thes_tonos_normalize: {
        title: 'Κανονικοποίηση του "θές" σε "θες"',
        description: 'Αφαιρεί τον τόνο από την αυτόνομη λέξη "θές".',
        example: "θές να δεις -> θες να δεις",
        cases: 'Το αυτόνομο "θές".',
      },
      op_interjection_normalize: {
        title: 'Κανονικοποίηση του "ωπ" σε "οπ"',
        description: 'Μετατρέπει το επιφώνημα "ωπ" στην προτιμώμενη μορφή "οπ".',
        example: "ωπ -> οπ",
        cases: 'Το αυτόνομο "ωπ".',
      },
      andras_preference: {
        title: 'Επιλογή προτιμώμενης γραφής για "άντρας / άνδρας"',
        description: "Εφαρμόζει τη μορφή που επιλέγετε στις συνηθέστερες κλιτές μορφές της λέξης.",
        example: "άνδρας -> άντρας ή άντρας -> άνδρας",
        cases: "άντρας, άντρα, άντρες, αντρών και άνδρας, άνδρα, άνδρες, ανδρών",
      },
      epta_preference: {
        title: 'Επιλογή προτιμώμενης γραφής για "επτά / εφτά"',
        description:
          "Εφαρμόζει τη μορφή του αριθμού που προτιμάτε όπου εμφανίζονται αυτές οι παραλλαγές ως αυτόνομες λέξεις.",
        example: "εφτά -> επτά ή επτά -> εφτά",
        cases: 'Τα αυτόνομα "επτά" και "εφτά".',
      },
      okto_preference: {
        title: 'Επιλογή προτιμώμενης γραφής για "οκτώ / οχτώ"',
        description:
          "Εφαρμόζει τη μορφή του αριθμού που προτιμάτε όπου εμφανίζονται αυτές οι παραλλαγές ως αυτόνομες λέξεις.",
        example: "οχτώ -> οκτώ ή οκτώ -> οχτώ",
        cases: 'Τα αυτόνομα "οκτώ" και "οχτώ".',
      },
      ennia_preference: {
        title: 'Επιλογή προτιμώμενης γραφής για "εννιά / εννέα"',
        description:
          "Εφαρμόζει τη μορφή του αριθμού που προτιμάτε όπου εμφανίζονται αυτές οι παραλλαγές ως αυτόνομες λέξεις.",
        example: "εννέα -> εννιά ή εννιά -> εννέα",
        cases: 'Τα αυτόνομα "εννιά" και "εννέα".',
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
      oson_afora_normalize: {
        title: 'Αλλαγή του "όσο αναφορά" σε "όσον αφορά"',
        description: 'Μετατρέπει τη φράση "όσο αναφορά" σε "όσον αφορά".',
        example: "όσο αναφορά το θέμα -> όσον αφορά το θέμα",
        cases: 'Η πλήρης φράση "όσο αναφορά".',
      },
      ap_oti_normalize: {
        title: 'Αλλαγή του "απ\' ότι" σε "απ\' ό,τι"',
        description: 'Μετατρέπει τη φράση "απ\' ότι" σε "απ\' ό,τι".',
        example: "απ' ότι ξέρω -> απ' ό,τι ξέρω",
        cases: 'Η πλήρης φράση "απ\' ότι".',
      },
      ypopsi_normalize: {
        title: 'Κανονικοποίηση των "υπόψιν / υπ\' όψιν" σε "υπόψη"',
        description: 'Μετατρέπει τα "υπόψιν" και "υπ\' όψιν" σε "υπόψη".',
        example: "υπ' όψιν -> υπόψη",
        cases: "υπόψιν, υπ' όψιν",
      },
      sintrivani_normalize: {
        title: 'Αλλαγή του "συντριβάνι" σε "σιντριβάνι"',
        description: 'Μετατρέπει τη λέξη "συντριβάνι" σε "σιντριβάνι".',
        example: "συντριβάνι -> σιντριβάνι",
        cases: 'Η αυτόνομη λέξη "συντριβάνι".',
      },
      en_telei_normalize: {
        title: 'Αλλαγή του "εν τέλη" σε "εντέλει"',
        description: 'Μετατρέπει τη φράση "εν τέλη" σε "εντέλει".',
        example: "εν τέλη -> εντέλει",
        cases: 'Η πλήρης φράση "εν τέλη".',
      },
      en_merei_normalize: {
        title: 'Αλλαγή του "εν μέρη" σε "εν μέρει"',
        description: 'Μετατρέπει τη φράση "εν μέρη" σε "εν μέρει".',
        example: "εν μέρη -> εν μέρει",
        cases: 'Η πλήρης φράση "εν μέρη".',
      },
      haha_spacing_normalize: {
        title: 'Κανονικοποίηση του "χαχα" σε "χα, χα"',
        description:
          'Μετατρέπει τη συμπτυγμένη γραφή γέλιου "χαχα" στην πιο ευανάγνωστη μορφή "χα, χα".',
        example: "χαχα -> χα, χα",
        cases: 'Το αυτόνομο "χαχα".',
      },
      popo_normalize: {
        title: 'Κανονικοποίηση του "πω πω / πωπω" σε "ποπό"',
        description:
          'Μετατρέπει τις επιφωνηματικές μορφές "πω πω", "πωπω" και "πωπωω" στη μορφή "ποπό".',
        example: "πω πω -> ποπό",
        cases: "πω πω, πωπω, πωπωω και κοντινές παραλλαγές του ίδιου επιφωνήματος",
      },
      dei_family_tonos_normalize: {
        title: 'Αφαίρεση του τόνου από επιλεγμένες μορφές του "δει"',
        description: 'Κανονικοποιεί μορφές όπως "δεί", "δείς" και "δούν" στις γραφές χωρίς τόνο.',
        example: "δείς -> δεις, δούν -> δουν",
        cases: "δεί, δείς, δούν",
      },
      chairetisa_family_normalize: {
        title: 'Κανονικοποίηση της οικογένειας "χαιρέτησα"',
        description:
          'Μετατρέπει επιλεγμένες παρελθοντικές μορφές που γράφονται με "-τισ-" στην προτιμώμενη οικογένεια με "-τησ-".',
        example: "χαιρέτισα -> χαιρέτησα",
        cases: "χαιρέτισα, χαιρέτισες, χαιρέτισε, χαιρετίσαμε, χαιρετίσατε, χαιρέτισαν",
      },
      xtes_family_normalize: {
        title: 'Κανονικοποίηση του "(προ)χθές / χτές" σε "(προ)χτες"',
        description:
          'Μετατρέπει τις επιλεγμένες παραλλαγές με θήτα ή τονισμένο ταυ στις προτιμώμενες μορφές με σκέτο "χτες".',
        example: "χθές -> χτες, προχθές -> προχτές",
        cases: "χθές, χτές, προχθές",
      },
      geia_tonos_normalize: {
        title: 'Κανονικοποίηση του "γειά" σε "γεια"',
        description: 'Αφαιρεί τον τόνο από την αυτόνομη λέξη "γειά".',
        example: "γειά σου -> γεια σου",
        cases: 'Το αυτόνομο "γειά".',
      },
      mov_normalize: {
        title: 'Κανονικοποίηση του "μωβ / μώβ" σε "μοβ"',
        description:
          'Μετατρέπει τη λέξη του χρώματος "μωβ" και την τονισμένη παραλλαγή της στην προτιμώμενη μορφή "μοβ".',
        example: "μώβ -> μοβ",
        cases: "μωβ, μώβ",
      },
      antepexerxomai_normalize: {
        title: 'Κανονικοποίηση της οικογένειας "αντεπεξέρχομαι"',
        description:
          'Κανονικοποιεί παράγωγες μορφές που γράφονται ως "ανταπεξ-" στη σωστή οικογένεια "αντεπεξ-".',
        example: "ανταπεξέρχομαι -> αντεπεξέρχομαι",
        cases: "ανταπεξέρχομαι, ανταπεξήλθα και συγγενικές μορφές",
      },
      apathanatizo_normalize: {
        title: 'Κανονικοποίηση της οικογένειας "απαθανατίζω"',
        description:
          'Κανονικοποιεί παράγωγες μορφές που γράφονται ως "αποθανατ-" στη σωστή οικογένεια "απαθανατ-".',
        example: "αποθανατίζω -> απαθανατίζω",
        cases: "αποθανατίζω, αποθανατίστηκε και συγγενικές μορφές",
      },
      zaploutos_normalize: {
        title: 'Αλλαγή του "ζάμπλουτος" σε "ζάπλουτος"',
        description: 'Μετατρέπει τη λέξη "ζάμπλουτος" σε "ζάπλουτος".',
        example: "ζάμπλουτος -> ζάπλουτος",
        cases: 'Η αυτόνομη λέξη "ζάμπλουτος".',
      },
      synonthylevma_normalize: {
        title: 'Αλλαγή του "συνοθύλευμα" σε "συνονθύλευμα"',
        description: 'Μετατρέπει τη λέξη "συνοθύλευμα" σε "συνονθύλευμα".',
        example: "συνοθύλευμα -> συνονθύλευμα",
        cases: 'Η αυτόνομη λέξη "συνοθύλευμα".',
      },
      myes_normalize: {
        title: 'Κανονικοποίηση των "μύες / μυς" στα ζητούμενα σχήματα',
        description:
          'Μετατρέπει το "τους μύες" σε "τους μυς", το "οι μυς" σε "οι μύες" και επίσης το "τους <λέξη> μύες" σε "τους <λέξη> μυς".',
        example: "τους μεγάλους μύες -> τους μεγάλους μυς",
        cases: "τους μύες, οι μυς, τους <λέξη> μύες",
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
      fixed_hyphenated_phrases_normalize: {
        title: "Ενωτική παύλα σε σταθερές ζευγαρωτές εκφράσεις",
        description:
          'Μετατρέπει συχνές ζευγαρωτές εκφράσεις στις μορφές με ενωτική παύλα, όπως "πρωί-βράδυ" και "άψε-σβήσε".',
        example: "πρωί βράδυ -> πρωί-βράδυ",
        cases: "πρωί βράδυ, μέρα νύχτα, άψε σβήσε, πέρα δώθε",
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
