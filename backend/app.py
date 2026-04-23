from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import io

app = Flask(__name__)
CORS(app)

# ── Load model bundle once at startup ────────────────────────────────────────
bundle   = joblib.load("model.pkl")
model    = bundle["model"]
scaler   = bundle["scaler"]
features = bundle["features"]

# ── Pre-compute static chart data from the dataset ───────────────────────────
_df_raw = pd.read_csv("Wind_Scada_datset.csv")
_df_raw["LV ActivePower (kW)"] = _df_raw["LV ActivePower (kW)"].apply(
    lambda x: 0 if x < 0 else x
)
_df_raw["Date/Time"] = pd.to_datetime(_df_raw["Date/Time"], format="%d %m %Y %H:%M")
_df_raw["Month"]     = _df_raw["Date/Time"].dt.month
_df_raw["Hour"]      = _df_raw["Date/Time"].dt.hour

# Power curve (40 wind-speed buckets)
_pc = _df_raw.groupby(pd.cut(_df_raw["Wind Speed (m/s)"], bins=40)).agg(
    wind_speed=("Wind Speed (m/s)", "mean"),
    actual=("LV ActivePower (kW)", "mean"),
    theoretical=("Theoretical_Power_Curve (KWh)", "mean"),
).dropna().round(2).reset_index(drop=True)
POWER_CURVE = _pc.to_dict(orient="records")

# Heatmap (month x hour -> avg kW)
_hm = _df_raw.pivot_table(
    values="LV ActivePower (kW)", index="Month", columns="Hour", aggfunc="mean"
).round(1)
HEATMAP = [
    {"month": int(m), "hour": int(h), "value": float(_hm.loc[m, h])}
    for m in range(1, 13)
    for h in range(24)
]

# Local MAE per wind-speed bucket
_MAE_BY_WS = {
    "0-4":   15.5,
    "4-7":   50.0,
    "7-10":  109.7,
    "10-13": 167.5,
    "13-16": 134.9,
    "16+":   80.5,
}

def _ws_bucket(ws):
    if ws < 4:   return "0-4"
    if ws < 7:   return "4-7"
    if ws < 10:  return "7-10"
    if ws < 13:  return "10-13"
    if ws < 16:  return "13-16"
    return "16+"

SEASON_MAP = {
    12: "Winter", 1: "Winter",  2: "Winter",
    3:  "Spring",  4: "Spring",  5: "Spring",
    6:  "Summer",  7: "Summer",  8: "Summer",
    9:  "Autumn",  10: "Autumn", 11: "Autumn",
}

def _build_row(wind_speed, wind_direction, theoretical_power, month, hour, week):
    season = SEASON_MAP.get(int(month), "Autumn")
    row = {
        "Wind Speed (m/s)":              float(wind_speed),
        "Theoretical_Power_Curve (KWh)": float(theoretical_power),
        "Wind Direction (°)":            float(wind_direction),
        "Week":  int(week),
        "Month": int(month),
        "Hour":  int(hour),
        "Season_Autumn": 1 if season == "Autumn" else 0,
        "Season_Spring": 1 if season == "Spring" else 0,
        "Season_Summer": 1 if season == "Summer" else 0,
        "Season_Winter": 1 if season == "Winter" else 0,
    }
    df_row   = pd.DataFrame([row])[features]
    X_scaled = scaler.transform(df_row)
    pred     = float(max(0.0, model.predict(X_scaled)[0]))
    return pred, season


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "features": features})


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    try:
        ws = float(data["wind_speed"])
        wd = float(data["wind_direction"])
        tp = float(data["theoretical_power"])
        mo = int(data.get("month", 1))
        hr = int(data.get("hour", 12))
        wk = int(data.get("week", 1))
    except (KeyError, ValueError) as e:
        return jsonify({"error": f"Bad input: {e}"}), 400

    pred, season = _build_row(ws, wd, tp, mo, hr, wk)
    mae = _MAE_BY_WS[_ws_bucket(ws)]

    return jsonify({
        "predicted_power_kw": round(pred, 2),
        "capacity_pct":       round(pred / 3600 * 100, 1),
        "ci_lower_kw":        round(max(0.0, pred - 1.96 * mae), 2),
        "ci_upper_kw":        round(min(3600.0, pred + 1.96 * mae), 2),
        "season":             season,
    })


@app.route("/data/powercurve", methods=["GET"])
def power_curve():
    return jsonify(POWER_CURVE)


@app.route("/data/heatmap", methods=["GET"])
def heatmap():
    return jsonify(HEATMAP)


@app.route("/predict/batch", methods=["POST"])
def predict_batch():
    if "file" not in request.files:
        return jsonify({"error": "Send multipart/form-data with key 'file'."}), 400
    f = request.files["file"]
    try:
        df = pd.read_csv(io.StringIO(f.read().decode("utf-8")))
    except Exception as e:
        return jsonify({"error": f"Could not parse CSV: {e}"}), 400

    required = ["Wind Speed (m/s)", "Wind Direction (deg)", "Theoretical_Power_Curve (KWh)"]
    # Accept both column name variants
    col_map = {}
    for c in df.columns:
        if "wind speed" in c.lower():     col_map[c] = "Wind Speed (m/s)"
        if "wind direction" in c.lower(): col_map[c] = "Wind Direction (°)"
        if "theoretical" in c.lower():    col_map[c] = "Theoretical_Power_Curve (KWh)"
        if "month" in c.lower():          col_map[c] = "Month"
        if "hour" in c.lower():           col_map[c] = "Hour"
        if "week" in c.lower():           col_map[c] = "Week"
    df = df.rename(columns=col_map)

    for col in ["Wind Speed (m/s)", "Wind Direction (°)", "Theoretical_Power_Curve (KWh)"]:
        if col not in df.columns:
            return jsonify({"error": f"Missing column: {col}"}), 400

    now = pd.Timestamp.now()
    if "Month" not in df.columns: df["Month"] = now.month
    if "Hour"  not in df.columns: df["Hour"]  = now.hour
    if "Week"  not in df.columns: df["Week"]  = now.isocalendar().week

    df["Wind Speed (m/s)"] = df["Wind Speed (m/s)"].clip(lower=0)

    rows = []
    for _, r in df.iterrows():
        season = SEASON_MAP.get(int(r["Month"]), "Autumn")
        rows.append({
            "Wind Speed (m/s)":              float(r["Wind Speed (m/s)"]),
            "Theoretical_Power_Curve (KWh)": float(r["Theoretical_Power_Curve (KWh)"]),
            "Wind Direction (°)":            float(r["Wind Direction (°)"]),
            "Week":  int(r["Week"]),
            "Month": int(r["Month"]),
            "Hour":  int(r["Hour"]),
            "Season_Autumn": int(season == "Autumn"),
            "Season_Spring": int(season == "Spring"),
            "Season_Summer": int(season == "Summer"),
            "Season_Winter": int(season == "Winter"),
        })

    X_scaled = scaler.transform(pd.DataFrame(rows)[features])
    preds    = np.maximum(0, model.predict(X_scaled))

    df_out = df.copy()
    df_out["Predicted_Power_kW"] = preds.round(2)
    df_out["Capacity_pct"]       = (preds / 3600 * 100).round(1)

    from flask import Response
    return Response(
        df_out.to_csv(index=False),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=predictions.csv"},
    )


if __name__ == "__main__":
    app.run(port=5000, debug=True)
