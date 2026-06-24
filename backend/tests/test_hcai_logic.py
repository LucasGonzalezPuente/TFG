"""
tests/test_hcai_logic.py
Pure unit tests for calcular_score_hcai.
No DB, no HTTP — just function calls.
"""
import pytest
from backend.hcai_logic import calcular_score_hcai, SCALES


# ── SCALES constant ───────────────────────────────────────────────────────────

class TestScalesConstant:
    def test_all_letters_defined(self):
        assert set(SCALES.keys()) == {"a", "b", "c", "d", "e"}

    def test_letter_values_are_descending(self):
        assert SCALES["a"] > SCALES["b"] > SCALES["c"] > SCALES["d"] > SCALES["e"]

    def test_a_is_100_e_is_0(self):
        assert SCALES["a"] == 100
        assert SCALES["e"] == 0


# ── Empty / edge cases ────────────────────────────────────────────────────────

class TestEdgeCases:
    def test_empty_dict_returns_zeros(self):
        result = calcular_score_hcai({})
        assert result == {"conf": 0.0, "expl": 0.0, "cogn": 0.0}

    def test_unknown_key_is_ignored(self):
        result = calcular_score_hcai({"x_unknown": "a", "z_other": 99})
        assert result == {"conf": 0.0, "expl": 0.0, "cogn": 0.0}

    def test_invalid_nasa_value_is_skipped(self):
        result = calcular_score_hcai({"nasa_1": "not_a_number"})
        assert result["cogn"] == 0.0

    def test_invalid_p_letter_falls_back_to_50(self):
        # 'z' is not in SCALES → SCALES.get returns 50 (the default)
        result = calcular_score_hcai({"p1": "z"})
        assert result["conf"] == 50.0


# ── Confianza bucket (p1–p4) ─────────────────────────────────────────────────

class TestConfianza:
    def test_single_p1_a(self):
        result = calcular_score_hcai({"p1": "a"})
        assert result["conf"] == 100.0
        assert result["expl"] == 0.0
        assert result["cogn"] == 0.0

    def test_all_five_letters_average(self):
        # p1=100, p2=75, p3=50, p4=25, — but p4 is still ≤4 so goes to conf
        # For 4 items: (100+75+50+25)/4 = 62.5
        result = calcular_score_hcai({"p1": "a", "p2": "b", "p3": "c", "p4": "d"})
        assert result["conf"] == pytest.approx(62.5, abs=0.1)

    def test_conf_rounding_to_one_decimal(self):
        # p1=75, p2=50 → avg = 62.5 → rounds to 62.5
        result = calcular_score_hcai({"p1": "b", "p2": "c"})
        assert result["conf"] == 62.5


# ── Explicabilidad bucket (p5+) ───────────────────────────────────────────────

class TestExplicabilidad:
    def test_p5_goes_to_expl_not_conf(self):
        result = calcular_score_hcai({"p5": "a"})
        assert result["expl"] == 100.0
        assert result["conf"] == 0.0

    def test_p10_and_p15_go_to_expl(self):
        result = calcular_score_hcai({"p10": "b", "p15": "c"})
        assert result["expl"] == pytest.approx(62.5, abs=0.1)

    def test_mixed_conf_and_expl(self):
        result = calcular_score_hcai({"p1": "a", "p5": "e"})
        assert result["conf"] == 100.0
        assert result["expl"] == 0.0

    def test_key_with_suffix_parsed_correctly(self):
        # "p5_explicabilidad" → num=5 → expl bucket
        result = calcular_score_hcai({"p5_explicabilidad": "a"})
        assert result["expl"] == 100.0
        assert result["conf"] == 0.0


# ── Carga cognitiva (nasa_*) ──────────────────────────────────────────────────

class TestCargaCognitiva:
    def test_single_nasa_item(self):
        result = calcular_score_hcai({"nasa_1": 60})
        assert result["cogn"] == 60.0

    def test_multiple_nasa_items_averaged(self):
        result = calcular_score_hcai({"nasa_1": 40, "nasa_2": 80})
        assert result["cogn"] == pytest.approx(60.0, abs=0.1)

    def test_nasa_zero_value(self):
        result = calcular_score_hcai({"nasa_1": 0})
        assert result["cogn"] == 0.0

    def test_nasa_string_int_is_cast(self):
        # The backend stores slider values; some may arrive as strings
        result = calcular_score_hcai({"nasa_1": "70"})
        assert result["cogn"] == 70.0


# ── Full realistic survey ─────────────────────────────────────────────────────

class TestFullSurvey:
    SAMPLE = {
        "p1": "a",   # 100  → conf
        "p2": "b",   # 75   → conf
        "p3": "c",   # 50   → conf
        "p4": "d",   # 25   → conf   avg_conf = 62.5
        "p5": "a",   # 100  → expl
        "p6": "b",   # 75   → expl   avg_expl = 87.5
        "nasa_1": 30,
        "nasa_2": 50,               # avg_cogn = 40.0
    }

    def test_conf(self):
        result = calcular_score_hcai(self.SAMPLE)
        assert result["conf"] == pytest.approx(62.5, abs=0.1)

    def test_expl(self):
        result = calcular_score_hcai(self.SAMPLE)
        assert result["expl"] == pytest.approx(87.5, abs=0.1)

    def test_cogn(self):
        result = calcular_score_hcai(self.SAMPLE)
        assert result["cogn"] == pytest.approx(40.0, abs=0.1)

    def test_output_keys_are_exactly_three(self):
        result = calcular_score_hcai(self.SAMPLE)
        assert set(result.keys()) == {"conf", "expl", "cogn"}
