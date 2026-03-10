/*
  The Books editor uses a shared frontend rule catalog so sections, ids, and
  preference selectors stay aligned with the backend rule registry.
*/
export type BooksGreekEditorSection = "literary" | "orthography" | "preferences";

export interface BooksGreekEditorPreferenceConfig {
  defaultValue: string;
  options: string[];
}

export interface BooksGreekEditorRule {
  id: string;
  section: BooksGreekEditorSection;
  preferenceKey?: keyof typeof BOOKS_GREEK_EDITOR_PREFERENCES;
}

export const BOOKS_GREEK_EDITOR_PREFERENCES: Record<string, BooksGreekEditorPreferenceConfig> = {
  andrasStyle: {
    defaultValue: "antras",
    options: ["antras", "andras"],
  },
  avgoStyle: {
    defaultValue: "avgo",
    options: ["avgo", "avgoBeta"],
  },
  eptaStyle: {
    defaultValue: "epta",
    options: ["epta", "efta"],
  },
  oktoStyle: {
    defaultValue: "okto",
    options: ["okto", "oxto"],
  },
  enniaStyle: {
    defaultValue: "ennia",
    options: ["ennia", "ennea"],
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

export const BOOKS_GREEK_EDITOR_RULES: BooksGreekEditorRule[] = [
  { id: "kai_before_vowel", section: "literary" },
  { id: "stin_article_trim", section: "literary" },
  { id: "min_negation_trim", section: "literary" },
  { id: "sa_to_san", section: "literary" },
  { id: "ellipsis_normalize", section: "literary" },
  { id: "multiple_spaces_normalize", section: "literary" },
  { id: "comma_space_normalize", section: "literary" },
  { id: "period_space_normalize", section: "literary" },
  { id: "guillemets_normalize", section: "literary" },
  { id: "akomi_to_akoma_before_kai", section: "literary" },
  { id: "me_se_mena_sena_contract", section: "literary" },
  { id: "prin_before_time_phrase", section: "literary" },
  { id: "question_pou_pos_toning", section: "literary" },
  { id: "quote_comma_trim", section: "literary" },
  { id: "kyriarx_no_hyphen", section: "literary" },
  { id: "nobility_titles_lowercase", section: "literary" },
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
  { id: "tromaktikos_family_normalize", section: "orthography" },
  { id: "dachtyla_family_normalize", section: "orthography" },
  { id: "nychta_family_normalize", section: "orthography" },
  { id: "niotho_family_normalize", section: "orthography" },
  { id: "dechtika_family_normalize", section: "orthography" },
  { id: "fos_normalize", section: "orthography" },
  { id: "apo_tonos_normalize", section: "orthography" },
  { id: "poios_family_tonos_normalize", section: "orthography" },
  { id: "mia_tonos_normalize", section: "orthography" },
  { id: "dyo_tonos_normalize", section: "orthography" },
  { id: "ti_tonos_normalize", section: "orthography" },
  { id: "pio_family_tonos_normalize", section: "orthography" },
  { id: "mpas_normalize", section: "orthography" },
  { id: "gios_family_tonos_normalize", section: "orthography" },
  { id: "nai_tonos_normalize", section: "orthography" },
  { id: "thes_tonos_normalize", section: "orthography" },
  { id: "op_interjection_normalize", section: "orthography" },
  { id: "och_interjection_normalize", section: "orthography" },
  { id: "zilia_normalize", section: "orthography" },
  { id: "ktirio_normalize", section: "orthography" },
  { id: "etaireia_normalize", section: "orthography" },
  { id: "oson_afora_normalize", section: "orthography" },
  { id: "ap_oti_normalize", section: "orthography" },
  { id: "ypopsi_normalize", section: "orthography" },
  { id: "sintrivani_normalize", section: "orthography" },
  { id: "en_telei_normalize", section: "orthography" },
  { id: "en_merei_normalize", section: "orthography" },
  { id: "haha_spacing_normalize", section: "orthography" },
  { id: "popo_normalize", section: "orthography" },
  { id: "dei_family_tonos_normalize", section: "orthography" },
  { id: "chairetisa_family_normalize", section: "orthography" },
  { id: "xtes_family_normalize", section: "orthography" },
  { id: "geia_tonos_normalize", section: "orthography" },
  { id: "mov_normalize", section: "orthography" },
  { id: "antepexerxomai_normalize", section: "orthography" },
  { id: "apathanatizo_normalize", section: "orthography" },
  { id: "zaploutos_normalize", section: "orthography" },
  { id: "synonthylevma_normalize", section: "orthography" },
  { id: "myes_normalize", section: "orthography" },
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
  { id: "fixed_hyphenated_phrases_normalize", section: "orthography" },
  { id: "pou_kai_pou_toning", section: "orthography" },
  { id: "colloquial_past_progressive_normalize", section: "orthography" },
  { id: "ok_uppercase", section: "orthography" },
  { id: "siga_siga_spacing", section: "orthography" },
  { id: "cheri_cheri_spacing", section: "orthography" },
  { id: "den_negation_trim", section: "preferences", preferenceKey: "denNegationStyle" },
  { id: "epta_preference", section: "preferences", preferenceKey: "eptaStyle" },
  { id: "okto_preference", section: "preferences", preferenceKey: "oktoStyle" },
  { id: "ennia_preference", section: "preferences", preferenceKey: "enniaStyle" },
  { id: "andras_preference", section: "preferences", preferenceKey: "andrasStyle" },
  { id: "avgo_preference", section: "preferences", preferenceKey: "avgoStyle" },
  { id: "quote_period_preference", section: "preferences", preferenceKey: "quotePeriodStyle" },
];

export const BOOKS_GREEK_EDITOR_RULE_IDS = BOOKS_GREEK_EDITOR_RULES.map(({ id }) => id);
