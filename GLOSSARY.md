# SmartCommute

SmartCommute is an eco-conscious commute planner and tracker combining live weather data, AI recommendations, and environmental impact calculations.

## Language

**Route**:
A predefined regular travel path between an origin and destination with a fixed distance and geographical coordinates.
_Avoid_: Trip, path, journey, track

**Commute Log**:
A recorded instance of an actual trip taken along a predefined Route, capturing transport mode, duration, saved emissions, and burned calories.
_Avoid_: Trip log, ride history, commute entry

**Transport Mode**:
The canonical discrete conveyance chosen for a commute, strictly one of: `car`, `bike`, `public_transit`, or `walk`.
_Avoid_: Vehicle type, commute method, travel mode

**Eco Metrics**:
Calculated environmental and health indicators for a Commute Log, specifically kilograms of CO2 saved compared to a baseline car trip (0.17 kg CO2/km) and active calories burned.
_Avoid_: Green stats, eco points, footprint reduction

**AI Advisor**:
An advisory service that evaluates route metrics and current weather conditions to recommend the optimal Transport Mode with human-readable rationale.
_Avoid_: Route optimizer, travel bot, suggestion engine

**Weather Simulator**:
An interactive testing control allowing evaluation of transport recommendations under simulated weather conditions (e.g. rain, sunny, windy, cold) alongside real-time Open-Meteo data.
_Avoid_: Weather override, mock weather, forecast tester

**Zero-Config Fallback**:
A deterministic rule engine that provides complete AI Advisor recommendations without crashing or failing when external LLM credentials (`OPENAI_API_KEY`) are omitted.
_Avoid_: Offline mode, dummy advisor, mock response
