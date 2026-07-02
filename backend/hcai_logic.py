"""
hcai_logic.py
Pure business logic for HCAI score computation.
No FastAPI or SQLAlchemy dependencies — easy to unit-test in isolation.
"""

# Likert letter → numeric score (higher = more positive)
SCALES: dict[str, int] = {"a": 100, "b": 75, "c": 50, "d": 25, "e": 0}


def calcular_score_hcai(respuestas: dict) -> dict:
    """
    Given a flat dict of survey answers, returns aggregated HCAI dimensions:
      conf  – average trust score (p1–p8, Likert scale)
      expl  – average explainability score (p9–p15, Likert scale)
      cogn  – average cognitive load (nasa_* items, 0–100 slider)

    Rules:
      • Keys starting with "nasa" → cognitive load (raw int)
      • Keys starting with "p"    → trust (p1–p8) or explainability (p9+)
    """
    scores: dict[str, list] = {"confianza": [], "explicabilidad": [], "carga_cognitiva": []}

    for key, value in respuestas.items():
        if key.startswith("nasa"):
            try:
                scores["carga_cognitiva"].append(int(value))
            except (ValueError, TypeError):
                pass

        elif key.startswith("p"):
            val = SCALES.get(value, 50)
            try:
                num = int(key.split("_")[0][1:])   # e.g. "p1_confianza" → 1
                bucket = "confianza" if num <= 8 else "explicabilidad"
            except (IndexError, ValueError):
                bucket = "explicabilidad"
            scores[bucket].append(val)

    def avg(lst: list) -> float:
        return sum(lst) / len(lst) if lst else 0.0

    return {
        "conf": round(avg(scores["confianza"]),       1),
        "expl": round(avg(scores["explicabilidad"]),  1),
        "cogn": round(avg(scores["carga_cognitiva"]), 1),
    }
