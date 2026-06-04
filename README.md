# 🌬️ WindWise

An integrated, AI-driven wind energy forecasting and grid scheduling system — combining physics-based modeling, hybrid ML forecasting, and deep reinforcement learning to deliver accurate wind power prediction and cost-efficient grid dispatch under real-world uncertainty.

## Architecture
**Layer 1 — Physics + CNN:** Turbine power modeling from atmospheric equations; CNN extracts spatial patterns across sensor locations.

**Layer 2 — Hybrid Forecasting:** LSTM for temporal dependencies, XGBoost as a residual corrector for short-term wind power prediction.

**Layer 3 & 4 — DRL Scheduling:** Actor-critic agent trained on a simulated grid environment, deployed for day-ahead unit commitment on IEEE 39-bus and 118-bus benchmark systems.

## Stack

Python · React · PyTorch · XGBoost · scikit-learn

## Getting Started

```bash
# Backend
cd backend && pip install -r requirements.txt && python app.py

# Frontend
cd windwise && npm install && npm start
```
