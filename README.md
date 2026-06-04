WindWise — an integrated, AI-driven wind energy forecasting and scheduling system that combines physics-based modeling, hybrid machine learning forecasting, and deep reinforcement learning to deliver wind power prediction and intelligent, stable, cost-efficient grid scheduling under real-world uncertainty.


Layer 1 - Physics-Based Modeling + CNN

To model wind turbine power output using atmospheric physics equations and validate the output accuracy of physics-based power estimation against real wind speed data.
To apply a Convolutional Neural Network to extract spatial patterns from multi-location wind data, creating structured and physically meaningful input features for downstream forecasting models.

Layer 2 — Hybrid Forecasting (LSTM + XGBoost)

To design and train an LSTM model that captures temporal dependencies in wind speed and power time-series data for  short-term wind power forecasting.
To integrate XGBoost as a residual corrector alongside LSTM outputs and evaluate the hybrid ensemble model's forecasting against LSTM and XGBoost baselines using different metrics.

Layer 3 — DRL for Decision Modeling

To formulate the grid scheduling problem as a Markov Decision Process and design a state-action-reward framework that captures wind uncertainty, load demand, generator constraints, and battery storage dynamics.
To implement and train an actor-critic deep reinforcement learning agent in a simulated IEEE bus system environment and evaluate its ability to learn a stable, cost-minimizing scheduling policy under varying wind and demand conditions.

Layer 4 — DRL for Grid Scheduling

To deploy the trained DRL policy for day-ahead generator commitment decisions on benchmark IEEE 39-bus and IEEE 118-bus systems and evaluate scheduling performance against traditional unit commitment methods.
To validate that the end-to-end WindWise pipeline from physics modeling through forecasting to DRL scheduling, produces feasible, constraint-satisfying, and cost-efficient grid dispatch decisions under real-world wind power uncertainty
