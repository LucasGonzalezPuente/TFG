// ─── Escala Likert ────────────────────────────────────────────────────────────
export const OPCIONES_LIKERT = [
  { valor: 'a', texto: 'Completamente de acuerdo' },
  { valor: 'b', texto: 'Estoy algo de acuerdo' },
  { valor: 'c', texto: 'Soy neutral al respecto' },
  { valor: 'd', texto: 'Estoy algo en desacuerdo' },
  { valor: 'e', texto: 'Completamente en desacuerdo' },
];

// ─── Sección 1: Confianza ─────────────────────────────────────────────────────
export const PREGUNTAS_CONFIANZA = [
  { id: 'p1_confianza',   texto: '1. Tengo confianza en la herramienta. Siento que funciona bien.' },
  { id: 'p2_predecible',  texto: '2. Los resultados de la herramienta fueron muy predecibles.' },
  { id: 'p3_fiabilidad',  texto: '3. La herramienta es muy confiable. Puedo confiar en los resultados.' },
  { id: 'p4_seguridad',   texto: '4. Tengo la seguridad de que obtendré resultados adecuados.' },
  { id: 'p5_eficiencia',  texto: '5. La herramienta es eficiente y funciona de forma rápida.' },
  { id: 'p6_desconfianza',texto: '6. Desconfío de la herramienta.' },
  { id: 'p7_experto',     texto: '7. Realiza la tarea mejor que un usuario inexperto.' },
  { id: 'p8_decision',    texto: '8. Me gusta utilizarla para la toma de decisiones.' },
];

// ─── Sección 2: Explicabilidad ────────────────────────────────────────────────
export const PREGUNTAS_EXPLICABILIDAD = [
  { id: 'p9_conozco',       texto: '1. A partir de la explicación, conozco cómo funciona.' },
  { id: 'p10_satisfactoria',texto: '2. La explicación de cómo funciona es satisfactoria.' },
  { id: 'p11_detalle',      texto: '3. La explicación tiene suficiente detalle.' },
  { id: 'p12_completa',     texto: '4. La explicación se presenta completa.' },
  { id: 'p13_uso',          texto: '5. La explicación me indica cómo usarla.' },
  { id: 'p14_objetivos',    texto: '6. La explicación me ayuda para mis objetivos.' },
  { id: 'p15_precision',    texto: '7. La explicación me enseña cuán precisa es.' },
];

// ─── Sección 3: Carga cognitiva (NASA-TLX) ───────────────────────────────────
export const PREGUNTAS_NASA = [
  { id: 'nasa_mental',      titulo: 'Exigencia Mental',     desc: '¿Cuánta actividad mental y perceptiva fue necesaria?', min: 'Muy Baja',  max: 'Muy Alta' },
  { id: 'nasa_fisica',      titulo: 'Exigencia Física',     desc: '¿Cuánta actividad física fue necesaria?',              min: 'Muy Baja',  max: 'Muy Alta' },
  { id: 'nasa_temporal',    titulo: 'Exigencia Temporal',   desc: '¿Cuánta presión de tiempo sintió?',                   min: 'Muy Baja',  max: 'Muy Alta' },
  { id: 'nasa_rendimiento', titulo: 'Rendimiento',          desc: '¿Qué tan exitoso cree que fue?',                      min: 'Perfecto',  max: 'Fallo'    },
  { id: 'nasa_esfuerzo',    titulo: 'Esfuerzo',             desc: '¿Qué tan duro tuvo que trabajar?',                    min: 'Muy Bajo',  max: 'Muy Alto' },
  { id: 'nasa_frustracion', titulo: 'Nivel de Frustración', desc: '¿Qué tan inseguro, desalentado o estresado se sintió?', min: 'Muy Bajo', max: 'Muy Alto' },
];

// ─── Métricas técnicas de IA (EvaluatorPanel) ────────────────────────────────
export const METRICAS_AI = [
  { id: 'accuracy',  label: 'Accuracy (Exactitud)',          placeholder: '0.0 – 1.0' },
  { id: 'precision', label: 'Precision',                     placeholder: '0.0 – 1.0' },
  { id: 'recall',    label: 'Recall (Sensibilidad)',          placeholder: '0.0 – 1.0' },
  { id: 'f1_score',  label: 'F1-Score',                      placeholder: '0.0 – 1.0' },
  { id: 'auc_roc',   label: 'AUC-ROC',                       placeholder: '0.0 – 1.0' },
  { id: 'rmse',      label: 'RMSE (Root Mean Sq. Error)',     placeholder: 'Valor numérico' },
  { id: 'mae',       label: 'MAE (Mean Absolute Error)',      placeholder: 'Valor numérico' },
  { id: 'r2',        label: 'R² (Coef. Determinación)',       placeholder: '0.0 – 1.0' },
];
