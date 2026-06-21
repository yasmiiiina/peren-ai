# Interactive Body Visualization Dashboard

A Dash-based interactive dashboard for visualizing human body parameters with real-time data updates.

## Features

- **Interactive Body Visualization**: SVG-based human body with 8 distinct zones
- **Color-Coded Status**: Green (normal), Yellow (warning), Red (alert) based on parameter values
- **Dynamic Opacity**: Visual intensity based on deviation from normal ranges
- **Interactive Zones**: Click on any body part to view detailed information
- **Historical Charts**: 7-day historical data for each parameter
- **Real-time Updates**: Refresh button to generate new sample data
- **Hover Tooltips**: View parameter details on hover

## Body Zones and Parameters

| Zone | Parameter | Unit | Normal Range |
|------|-----------|------|--------------|
| Head | Cognitive Load | score (0-100) | 0-50 |
| Neck | Muscle Tension | % | 0-30 |
| Torso | Oxygenation | SpO2 % | 95-100 |
| Heart | Heart Rate | BPM | 60-100 |
| Left Arm | Muscle Load | % | 0-40 |
| Right Arm | Muscle Load | % | 0-40 |
| Left Leg | Mobility | score (0-100) | 80-100 |
| Right Leg | Mobility | score (0-100) | 80-100 |

## Installation

1. Navigate to the backend directory:
```bash
cd perenai-website/backend
```

2. Activate the virtual environment:
```bash
.venv\Scripts\activate
```

3. Install dependencies (already included in requirements.txt):
```bash
pip install -r requirements.txt
```

Or install manually:
```bash
pip install dash plotly pandas numpy
```

## Running the Dashboard

Start the dashboard server:
```bash
python body_dashboard.py
```

The dashboard will be available at: **http://127.0.0.1:8050**

## Usage

1. **View Body Zones**: The left panel shows the interactive body visualization
2. **Check Status**: Colors indicate the status of each parameter:
   - 🟢 Green: Normal range
   - 🟡 Yellow: Warning (slightly outside normal range)
   - 🔴 Red: Alert (significantly outside normal range)
3. **Click for Details**: Click on any body zone to see:
   - Current value and unit
   - Normal range
   - Parameter description
   - 7-day historical chart
4. **Refresh Data**: Click the "Refresh Data" button to generate new sample data

## Customization

### Modifying Body Zones

Edit the `BODY_ZONES` dictionary in `body_dashboard.py` to add or modify zones:

```python
BODY_ZONES = {
    "zone_id": {
        "parameter": "Parameter Name",
        "unit": "unit",
        "normal_range": (min, max),
        "description": "Description text"
    }
}
```

### Adjusting Visual Logic

Modify the color and opacity functions:

- `get_color_for_value()`: Change color thresholds
- `get_opacity_for_value()`: Adjust opacity calculation

### Integrating Real Data

Replace the `generate_sample_data()` function with your actual data source:

```python
def generate_sample_data():
    # Replace with your API call or database query
    data = fetch_data_from_api()
    return data
```

## Tech Stack

- **Dash**: Web framework for interactive dashboards
- **Plotly**: Interactive graphing library
- **Pandas**: Data manipulation
- **NumPy**: Numerical computing

## Architecture

The dashboard follows these steps:

1. **SVG Body Illustration**: Flat design with distinct clickable zones
2. **Data Mapping**: Each zone maps to a specific health parameter
3. **Visual Logic**: Color and opacity based on value vs. normal range
4. **Interaction**: Click events trigger detailed view updates
5. **Real-time Updates**: Callback system for dynamic data refresh

## Future Enhancements

- Integration with existing FastAPI backend
- Real-time data streaming from sensors
- User authentication and personal data
- Export reports functionality
- Mobile responsive design
- Additional body zones and parameters
