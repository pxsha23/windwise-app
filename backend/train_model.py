"""
train_model.py — run once to train the XGBoost model and save model.pkl

Usage:
    python train_model.py --data path/to/Wind_Scada_datset.csv

The script will create model.pkl in the same directory.
"""

import argparse
import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
from xgboost import XGBRegressor


def get_season(month):
    if month in [12, 1, 2]:  return "Winter"
    elif month in [3, 4, 5]: return "Spring"
    elif month in [6, 7, 8]: return "Summer"
    else:                     return "Autumn"


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Fix negative power readings
    df["LV ActivePower (kW)"] = df["LV ActivePower (kW)"].apply(lambda x: 0 if x < 0 else x)

    # Parse datetime and extract temporal features
    df["Date/Time"] = pd.to_datetime(df["Date/Time"], format="%d %m %Y %H:%M")
    df["Week"]  = df["Date/Time"].dt.isocalendar().week.astype(int)
    df["Month"] = df["Date/Time"].dt.month
    df["Hour"]  = df["Date/Time"].dt.hour
    df["Season"] = df["Month"].apply(get_season)

    df = df.drop(columns=["Date/Time"])
    df = pd.get_dummies(df, columns=["Season"])

    return df


def main(csv_path: str, out_path: str = "model.pkl"):
    print(f"Loading data from: {csv_path}")
    raw = pd.read_csv(csv_path)
    print(f"  {len(raw):,} rows loaded")

    df = build_features(raw)

    y = df["LV ActivePower (kW)"]
    X = df.drop(columns=["LV ActivePower (kW)"])
    feature_names = X.columns.tolist()
    print(f"  Features: {feature_names}")

    scaler   = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    print("Training XGBRegressor …")
    model = XGBRegressor(
        n_estimators=1000,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    y_pred = model.predict(X_test)
    r2   = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    print(f"  R²   = {r2:.4f}")
    print(f"  RMSE = {rmse:.2f} kW")

    bundle = {"model": model, "scaler": scaler, "features": feature_names}
    joblib.dump(bundle, out_path)
    print(f"  Saved → {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--data",
        default="Wind_Scada_datset.csv",
        help="Path to Wind_Scada_datset.csv",
    )
    parser.add_argument(
        "--out",
        default="model.pkl",
        help="Output path for the model bundle (default: model.pkl)",
    )
    args = parser.parse_args()
    main(args.data, args.out)
