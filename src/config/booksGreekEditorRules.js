/*
  The Books editor uses a shared frontend rule catalog so sections, ids, and
  preference selectors stay aligned with the backend rule registry.
*/
export const BOOKS_GREEK_EDITOR_PREFERENCES = {
  andrasStyle: {
    defaultValue: "antras",
    options: ["antras", "andras"],
  },
  avgoStyle: {
    defaultValue: "avgo",
    options: ["avgo", "avgoBeta"],
  },
  denNegationStyle: {
    defaultValue: "contextual",
    options: ["contextual", "alwaysDen"],
  },
  quotePeriodStyle: {
    defaultValue: "outside",
    options: ["outside", "inside"],
  },
};

export const BOOKS_GREEK_EDITOR_RULES = [
  { id: "kai_before_vowel", section: "literary" },
  { id: "stin_article_trim", section: "literary" },
  { id: "min_negation_trim", section: "literary" },
  { id: "sa_to_san", section: "literary" },
  { id: "ellipsis_normalize", section: "literary" },
  { id: "multiple_spaces_normalize", section: "literary" },
  { id: "guillemets_normalize", section: "literary" },
  { id: "akomi_to_akoma_before_kai", section: "literary" },
  { id: "prin_na_to_protou", section: "literary" },
  { id: "me_se_mena_sena_contract", section: "literary" },
  { id: "prin_before_time_phrase", section: "literary" },
  { id: "question_pou_pos_toning", section: "literary" },
  { id: "quote_comma_trim", section: "literary" },
  { id: "mesa_sto_contract", section: "literary" },
  { id: "kathe_enas_series", section: "literary" },
  { id: "theos_phrases_normalize", section: "literary" },
  { id: "comma_before_subordinators", section: "literary" },
  { id: "anamesa_article_contract", section: "literary" },
  { id: "sto_to_contract", section: "literary" },
  { id: "vromia_family_omicron", section: "orthography" },
  { id: "antikrizo_family_iota", section: "orthography" },
  { id: "klotso_family_omicron", section: "orthography" },
  { id: "skeptikos_family_normalize", section: "orthography" },
  { id: "och_interjection_normalize", section: "orthography" },
  { id: "zilia_normalize", section: "orthography" },
  { id: "ktirio_normalize", section: "orthography" },
  { id: "etaireia_normalize", section: "orthography" },
  { id: "parolo_pou_normalize", section: "orthography" },
  { id: "par_ola_auta_normalize", section: "orthography" },
  { id: "parempiptontos_normalize", section: "orthography" },
  { id: "syngnomi_normalize", section: "orthography" },
  { id: "bira_normalize", section: "orthography" },
  { id: "xidi_normalize", section: "orthography" },
  { id: "parti_normalize", section: "orthography" },
  { id: "stil_normalize", section: "orthography" },
  { id: "xipolytos_normalize", section: "orthography" },
  { id: "chronon_normalize", section: "orthography" },
  { id: "xefysixe_normalize", section: "orthography" },
  { id: "me_mias_normalize", section: "orthography" },
  { id: "ex_archis_normalize", section: "orthography" },
  { id: "pou_kai_pou_toning", section: "orthography" },
  { id: "colloquial_past_progressive_normalize", section: "orthography" },
  { id: "ok_uppercase", section: "orthography" },
  { id: "siga_siga_spacing", section: "orthography" },
  { id: "cheri_cheri_spacing", section: "orthography" },
  { id: "den_negation_trim", section: "preferences", preferenceKey: "denNegationStyle" },
  { id: "andras_preference", section: "preferences", preferenceKey: "andrasStyle" },
  { id: "avgo_preference", section: "preferences", preferenceKey: "avgoStyle" },
  { id: "quote_period_preference", section: "preferences", preferenceKey: "quotePeriodStyle" },
];

export const BOOKS_GREEK_EDITOR_RULE_IDS = BOOKS_GREEK_EDITOR_RULES.map(({ id }) => id);
