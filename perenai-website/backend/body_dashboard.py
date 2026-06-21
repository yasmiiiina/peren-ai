"""
Interactive Body Visualization & Biometric Simulation Dashboard
Premium Clinical-Grade Medical AI Dashboard written in Python Dash & Plotly
"""

import dash
from dash import dcc, html, Input, Output, State
from dash_svg import Svg, Path, Circle, Ellipse, Rect, Line, Defs, Filter, FeGaussianBlur, FeMerge, FeMergeNode, G
import plotly.graph_objects as go
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Initialize Dash app
app = dash.Dash(
    __name__, 
    meta_tags=[{"name": "viewport", "content": "width=device-width, initial-scale=1"}]
)
app.title = "Human Body Biometric Analytics Dashboard"

# ═══════════════════════════════════════════════════════════════════════
# DASHBOARD CLINICAL METADATA AND CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════

ZONE_CONFIG = {
    "brain": {
        "label": "Cerveau / Skull",
        "icon": "🧠",
        "param": "brain",
        "paramLabel": "Cognitive Load",
        "unit": "%",
        "normal_range": (18, 35),
        "description": "Neural activity and cerebral oxygen saturation monitoring via EEG biomarkers.",
    },
    "heart": {
        "label": "Rythme Cardiaque",
        "icon": "❤️",
        "param": "heart",
        "paramLabel": "Rythme Cardiaque",
        "unit": "BPM",
        "normal_range": (55, 85),
        "description": "Cardiac rhythm, ejection fraction, and autonomic nervous system balance.",
    },
    "lungs": {
        "label": "Poumons / Thorax",
        "icon": "🫁",
        "param": "lungs",
        "paramLabel": "Saturation SpO₂",
        "unit": "%",
        "normal_range": (95, 100),
        "description": "Pulmonary oxygen saturation and respiratory volume efficiency.",
    },
    "liver": {
        "label": "Foie / Métabolisme",
        "icon": "🫀",
        "param": "liver",
        "paramLabel": "Indice Toxines",
        "unit": "μg/L",
        "normal_range": (0.0, 2.5),
        "description": "Hepatic metabolite clearance rate and visceral fat fraction.",
    },
    "leftArm": {
        "label": "Activation Musculaire (G)",
        "icon": "💪",
        "param": "leftArm",
        "paramLabel": "Charge Musculaire (G)",
        "unit": "%",
        "normal_range": (40, 75),
        "description": "Left arm muscular activation and load stress based on surface EMG analysis.",
    },
    "rightArm": {
        "label": "Activation Musculaire (D)",
        "icon": "💪",
        "param": "rightArm",
        "paramLabel": "Charge Musculaire (D)",
        "unit": "%",
        "normal_range": (45, 80),
        "description": "Right arm muscular activation and load stress based on surface EMG analysis.",
    },
    "core": {
        "label": "Sangle Abdominale / Core",
        "icon": "🏋️",
        "param": "core",
        "paramLabel": "Posture Score",
        "unit": "/100",
        "normal_range": (70, 95),
        "description": "Trunk stability index, spinal alignment and deep fascial tension mapping.",
    },
    "leftLeg": {
        "label": "Articulations / Jambe G",
        "icon": "🦵",
        "param": "leftLeg",
        "paramLabel": "Mobilité (G)",
        "unit": "/100",
        "normal_range": (65, 90),
        "description": "Joint mobility, range of motion, and bone mineral density score for left leg.",
    },
    "rightLeg": {
        "label": "Articulations / Jambe D",
        "icon": "🦵",
        "param": "rightLeg",
        "paramLabel": "Mobilité (D)",
        "unit": "/100",
        "normal_range": (65, 90),
        "description": "Load distribution, kinetic chain integrity and lower-limb vascular flow.",
    }
}

STATUS_PALETTE = {
    "optimal":  {"base": "#10b981", "glow": "rgba(16,185,129,0.55)", "fill": "rgba(16,185,129,0.18)", "stroke": "#34d399", "ring": "#6ee7b7", "label": "OPTIMAL", "bg": "#042c1d"},
    "warning":  {"base": "#f59e0b", "glow": "rgba(245,158,11,0.55)",  "fill": "rgba(245,158,11,0.18)",  "stroke": "#fbbf24", "ring": "#fde68a", "label": "ATTENTION", "bg": "#362206"},
    "critical": {"base": "#ef4444", "glow": "rgba(239,68,68,0.55)",   "fill": "rgba(239,68,68,0.18)",   "stroke": "#f87171", "ring": "#fca5a5", "label": "ALERT", "bg": "#3c0b0b"},
    "neutral":  {"base": "#60a5fa", "glow": "rgba(96,165,250,0.40)",  "fill": "rgba(96,165,250,0.10)",  "stroke": "#93c5fd", "ring": "#bfdbfe", "label": "—", "bg": "#0a2240"},
}

def get_zone_status(value, zone_id):
    thresholds = {
        "brain":    {"good": (18, 35), "warn": (36, 50)},
        "heart":    {"good": (55, 85), "warn": (86, 100)},
        "lungs":    {"good": (95, 100), "warn": (90, 94)},
        "liver":    {"good": (0.0, 2.5), "warn": (2.5, 4.0)},
        "leftArm":  {"good": (40, 75), "warn": (76, 90)},
        "rightArm": {"good": (45, 80), "warn": (81, 95)},
        "core":     {"good": (70, 100), "warn": (50, 69)},
        "leftLeg":  {"good": (65, 100), "warn": (45, 64)},
        "rightLeg": {"good": (65, 100), "warn": (45, 64)},
    }
    t = thresholds.get(zone_id)
    if not t or value is None:
        return "neutral"
    good_min, good_max = t["good"]
    warn_min, warn_max = t["warn"]
    
    if good_min <= value <= good_max:
        return "optimal"
    elif warn_min <= value <= warn_max:
        return "warning"
    else:
        return "critical"

# ═══════════════════════════════════════════════════════════════════════
# HELPER DATA GENERATORS (SIMULATOR ENGINE)
# ═══════════════════════════════════════════════════════════════════════

def get_current_mock_biometrics():
    return {
        "brain": 24.5,
        "heart": 68.0,
        "lungs": 98.2,
        "liver": 1.4,
        "leftArm": 52.0,
        "rightArm": 58.5,
        "core": 82.0,
        "leftLeg": 78.4,
        "rightLeg": 76.8,
    }

def generate_plotly_history(zone, val_now):
    """Generates custom 7-day longitudinal history data for Plotly charts"""
    config = ZONE_CONFIG[zone]
    normal_min, normal_max = config["normal_range"]
    
    dates = [(datetime.now() - timedelta(days=i)).strftime("%b %d") for i in range(6, -1, -1)]
    values = []
    
    # Generate random walking data leading up to the current value
    v = val_now
    for i in range(7):
        values.append(v)
        v = v - random.uniform(-v*0.06, v*0.06)
    values.reverse()
    values[-1] = val_now # anchor current

    fig = go.Figure()
    
    # Highlight Normal range band
    fig.add_hrect(
        y0=normal_min,
        y1=normal_max,
        fillcolor="rgba(0, 255, 157, 0.06)",
        line_width=0,
        annotation_text="Clinical Threshold (Normal)",
        annotation_position="top left",
        annotation_font=dict(color="#4f73a3", size=10)
    )

    # Actual trace
    status = get_zone_status(val_now, zone)
    line_color = STATUS_PALETTE[status]["base"]

    fig.add_trace(go.Scatter(
        x=dates,
        y=values,
        mode="lines+markers",
        name=config["paramLabel"],
        line=dict(color=line_color, width=3.5),
        marker=dict(size=10, borderwidth=2, bordercolor="#ffffff", color=line_color),
        hovertemplate="<b>Date</b>: %{x}<br><b>Valeur</b>: %{y:.1f} " + config["unit"] + "<extra></extra>"
    ))

    fig.update_layout(
        paper_bgcolor="transparent",
        plot_bgcolor="transparent",
        font=dict(color="#728aab", family="'Outfit', sans-serif"),
        margin=dict(l=40, r=20, t=40, b=40),
        xaxis=dict(showgrid=True, gridcolor="rgba(89, 156, 255, 0.05)", zeroline=False),
        yaxis=dict(showgrid=True, gridcolor="rgba(89, 156, 255, 0.05)", zeroline=False),
        title=dict(
            text=f"Longitudinal History: {config['paramLabel']}",
            font=dict(size=14, color="#ffffff", weight="bold")
        )
    )
    return fig

# ═══════════════════════════════════════════════════════════════════════
# DASH NATIVE SVG VISUALIZATION COMPONENTS
# ═══════════════════════════════════════════════════════════════════════

def build_unified_body_svg():
    """Builds native SVG flat body model with distinct interactive zones"""
    bodyColor = "rgba(96, 165, 250, 0.04)"
    bodyStroke = "rgba(96, 165, 250, 0.15)"
    
    return Svg(
        viewBox="0 0 200 520",
        id="unified-body-svg",
        className="unified-body-svg",
        children=[
            # Base Silhouette
            # Head
            Ellipse(cx="100", cy="34", rx="28", ry="30", fill=bodyColor, stroke=bodyStroke, strokeWidth="0.8"),
            # Neck
            Rect(x="89", y="60", width="22", height="18", rx="4", fill=bodyColor, stroke=bodyStroke, strokeWidth="0.8"),
            # Torso
            Path(
                d="M 52 80 C 44 84, 40 105, 40 130 L 40 260 C 40 268, 46 272, 52 272 L 148 272 C 154 272, 160 268, 160 260 L 160 130 C 160 105, 156 84, 148 80 C 138 74, 62 74, 52 80 Z",
                fill=bodyColor, stroke=bodyStroke, strokeWidth="0.8"
            ),
            # Left Arm
            Path(
                d="M 38 82 C 28 88, 18 110, 14 140 L 10 180 C 8 198, 12 210, 20 208 L 30 205 C 36 202, 38 192, 38 180 L 40 140 Z",
                fill=bodyColor, stroke=bodyStroke, strokeWidth="0.8"
            ),
            # Left Hand
            Ellipse(cx="16", cy="214", rx="10", ry="13", fill=bodyColor, stroke=bodyStroke, strokeWidth="0.8"),
            # Right Arm
            Path(
                d="M 162 82 C 172 88, 182 110, 186 140 L 190 180 C 192 198, 188 210, 180 208 L 170 205 C 164 202, 162 192, 162 180 L 160 140 Z",
                fill=bodyColor, stroke=bodyStroke, strokeWidth="0.8"
            ),
            # Right Hand
            Ellipse(cx="184", cy="214", rx="10", ry="13", fill=bodyColor, stroke=bodyStroke, strokeWidth="0.8"),
            # Left Leg
            Path(
                d="M 52 272 C 44 272, 38 278, 36 294 L 32 360 L 30 430 L 28 500 L 56 500 L 60 430 L 64 360 L 68 294 C 68 278, 62 272, 52 272 Z",
                fill=bodyColor, stroke=bodyStroke, strokeWidth="0.8"
            ),
            # Right Leg
            Path(
                d="M 148 272 C 138 272, 132 278, 132 294 L 136 360 L 140 430 L 144 500 L 172 500 L 170 430 L 168 360 L 164 294 C 164 278, 158 272, 148 272 Z",
                fill=bodyColor, stroke=bodyStroke, strokeWidth="0.8"
            ),
            
            # Decorative internal details
            Line(x1="100", y1="78", x2="100", y2="270", stroke="rgba(96,165,250,0.12)", strokeWidth="0.6", strokeDasharray="3,4"),
            Path(d="M 100 80 C 85 82, 72 86, 60 88", stroke="rgba(96,165,250,0.14)", strokeWidth="0.7", fill="none"),
            Path(d="M 100 80 C 115 82, 128 86, 140 88", stroke="rgba(96,165,250,0.14)", strokeWidth="0.7", fill="none"),
            Ellipse(cx="100", cy="145", rx="40", ry="50", fill="none", stroke="rgba(96,165,250,0.08)", strokeWidth="0.5"),
            Path(d="M 52 270 Q 100 280 148 270", stroke="rgba(96,165,250,0.10)", strokeWidth="0.6", fill="none"),

            # ── INTERACTIVE ZONES ──
            # BRAIN
            G(
                id="brain-group",
                n_clicks=0,
                className="svg-interactive-group brain-group",
                children=[
                    Path(
                        id="brain-path",
                        d="M 76 12 C 68 16, 64 26, 64 36 C 64 52, 72 62, 100 64 C 128 62, 136 52, 136 36 C 136 26, 132 16, 124 12 C 112 6, 88 6, 76 12 Z",
                        className="interactive-zone-path",
                    ),
                    Circle(cx="100", cy="38", r="4", id="brain-dot", className="status-dot-marker"),
                    html.Title(id="brain-title", children="Brain Scan")
                ]
            ),
            
            # HEART
            G(
                id="heart-group",
                n_clicks=0,
                className="svg-interactive-group heart-group",
                children=[
                    Path(
                        id="heart-path",
                        d="M 80 105 C 70 100, 62 106, 62 116 C 62 126, 68 132, 80 138 C 88 142, 94 148, 98 152 C 102 148, 108 142, 116 138 C 128 132, 134 126, 134 116 C 134 106, 126 100, 116 105 C 110 108, 106 112, 100 118 C 94 112, 90 108, 80 105 Z",
                        className="interactive-zone-path",
                    ),
                    Circle(cx="99", cy="128", r="4", id="heart-dot", className="status-dot-marker"),
                    html.Title(id="heart-title", children="Heart Scan")
                ]
            ),

            # LUNGS
            G(
                id="lungs-group",
                n_clicks=0,
                className="svg-interactive-group lungs-group",
                children=[
                    Path(
                        id="lungs-path",
                        d="M 56 92 C 48 98, 44 115, 44 135 L 44 170 C 44 180, 50 184, 58 182 C 66 180, 72 172, 78 162 C 82 154, 84 145, 84 135 C 84 118, 80 105, 72 98 C 66 92, 60 88, 56 92 Z M 144 92 C 140 88, 134 92, 128 98 C 120 105, 116 118, 116 135 C 116 145, 118 154, 122 162 C 128 172, 134 180, 142 182 C 150 184, 156 180, 156 170 L 156 135 C 156 115, 152 98, 144 92 Z",
                        className="interactive-zone-path",
                    ),
                    Circle(cx="100", cy="138", r="4", id="lungs-dot", className="status-dot-marker"),
                    html.Title(id="lungs-title", children="Lungs Scan")
                ]
            ),

            # LIVER
            G(
                id="liver-group",
                n_clicks=0,
                className="svg-interactive-group liver-group",
                children=[
                    Path(
                        id="liver-path",
                        d="M 68 192 C 56 196, 52 210, 54 226 C 56 240, 64 248, 78 250 C 88 252, 98 248, 104 242 C 110 248, 120 252, 130 250 C 144 248, 150 240, 148 226 C 146 210, 140 196, 128 192 C 118 188, 80 188, 68 192 Z",
                        className="interactive-zone-path",
                    ),
                    Circle(cx="100", cy="220", r="4", id="liver-dot", className="status-dot-marker"),
                    html.Title(id="liver-title", children="Liver Scan")
                ]
            ),

            # CORE
            G(
                id="core-group",
                n_clicks=0,
                className="svg-interactive-group core-group",
                children=[
                    Path(
                        id="core-path",
                        d="M 60 254 C 54 258, 50 268, 52 278 C 54 288, 62 292, 76 292 C 86 292, 94 288, 100 282 C 106 288, 114 292, 124 292 C 138 292, 146 288, 148 278 C 150 268, 146 258, 140 254 C 126 248, 74 248, 60 254 Z",
                        className="interactive-zone-path",
                    ),
                    Circle(cx="100", cy="272", r="4", id="core-dot", className="status-dot-marker"),
                    html.Title(id="core-title", children="Core Scan")
                ]
            ),

            # LEFT ARM
            G(
                id="leftArm-group",
                n_clicks=0,
                className="svg-interactive-group leftArm-group",
                children=[
                    Path(
                        id="leftArm-path",
                        d="M 36 86 C 26 94, 16 118, 12 148 L 10 178 C 8 192, 14 202, 24 200 C 32 198, 36 188, 36 176 L 38 148 L 44 108 Z",
                        className="interactive-zone-path",
                    ),
                    Circle(cx="22", cy="148", r="4", id="leftArm-dot", className="status-dot-marker"),
                    html.Title(id="leftArm-title", children="Left Arm Scan")
                ]
            ),

            # RIGHT ARM
            G(
                id="rightArm-group",
                n_clicks=0,
                className="svg-interactive-group rightArm-group",
                children=[
                    Path(
                        id="rightArm-path",
                        d="M 164 86 C 174 94, 184 118, 188 148 L 190 178 C 192 192, 186 202, 176 200 C 168 198, 164 188, 164 176 L 162 148 L 156 108 Z",
                        className="interactive-zone-path",
                    ),
                    Circle(cx="178", cy="148", r="4", id="rightArm-dot", className="status-dot-marker"),
                    html.Title(id="rightArm-title", children="Right Arm Scan")
                ]
            ),

            # LEFT LEG
            G(
                id="leftLeg-group",
                n_clicks=0,
                className="svg-interactive-group leftLeg-group",
                children=[
                    Path(
                        id="leftLeg-path",
                        d="M 44 298 C 36 302, 30 318, 28 342 L 26 400 L 24 470 C 22 488, 28 500, 40 500 L 56 500 C 64 500, 68 490, 68 474 L 66 400 L 66 342 C 64 318, 58 302, 52 298 Z",
                        className="interactive-zone-path",
                    ),
                    Circle(cx="46", cy="390", r="4", id="leftLeg-dot", className="status-dot-marker"),
                    html.Title(id="leftLeg-title", children="Left Leg Scan")
                ]
            ),

            # RIGHT LEG
            G(
                id="rightLeg-group",
                n_clicks=0,
                className="svg-interactive-group rightLeg-group",
                children=[
                    Path(
                        id="rightLeg-path",
                        d="M 156 298 C 164 302, 170 318, 172 342 L 174 400 L 176 470 C 178 488, 172 500, 160 500 L 144 500 C 136 500, 132 490, 132 474 L 134 400 L 134 342 C 136 318, 142 302, 148 298 Z",
                        className="interactive-zone-path",
                    ),
                    Circle(cx="154", cy="390", r="4", id="rightLeg-dot", className="status-dot-marker"),
                    html.Title(id="rightLeg-title", children="Right Leg Scan")
                ]
            )
        ]
    )

app.layout = html.Div(
    className="clinical-dashboard-root",
    children=[
        # Custom stylesheets loaded automatically from assets/style.css
        html.Div(style={"display": "none"}),
        
        # Hidden elements for SVG Defs
        Svg(
            style={"position": "absolute", "width": 0, "height": 0},
            children=[
                Defs([
                    Filter(
                        id="glowFilter",
                        children=[
                            FeGaussianBlur(stdDeviation="3", result="blur"),
                            FeMerge([
                                FeMergeNode(**{"in": "blur"}),
                                FeMergeNode(**{"in": "SourceGraphic"})
                            ])
                        ]
                    ),
                    Filter(
                        id="intenseGlow",
                        children=[
                            FeGaussianBlur(stdDeviation="6", result="blur1"),
                            FeGaussianBlur(stdDeviation="2", result="blur2"),
                            FeMerge([
                                FeMergeNode(**{"in": "blur1"}),
                                FeMergeNode(**{"in": "blur2"}),
                                FeMergeNode(**{"in": "SourceGraphic"})
                            ])
                        ]
                    )
                ])
            ]
        ),

        # Dcc state stores and triggers
        dcc.Store(id="live-biometrics-store", data=get_current_mock_biometrics()),
        dcc.Store(id="selected-zone-store", data="heart"),
        dcc.Store(id="console-logs-store", data=[]),
        dcc.Interval(id="simulator-interval-trigger", interval=1500, n_intervals=0),

        # New stores for Training Simulator integration (Next.js mirroring)
        dcc.Store(id="simulation-active-store", data=True),
        dcc.Store(id="expanded-scenario-store", data="S001"),
        dcc.Store(id="applied-scenario-store", data="S001"),

        # Main Layout Box
        html.Div(
            className="dashboard-container",
            children=[
                # Header Section
                html.Div(
                    className="header-top",
                    children=[
                        html.Div(
                            className="title-section",
                            children=[
                                html.H1("Human Body Analytics Dashboard"),
                                html.P("✓ Connected to live simulated biometrics feed · Clinical medical AI visualizer mode active")
                            ]
                        ),
                        # Live indicator
                        html.Div(
                            className="live-alert-indicator",
                            children=[
                                html.Div(className="blink-dot"),
                                html.Span("Live simulated feed active")
                            ]
                        ),
                        # Metadata Grid
                        html.Div(
                            className="meta-grid",
                            children=[
                                html.Div(className="meta-card", children=[
                                    html.Span("GENDER", className="meta-label"),
                                    html.Span("Female", className="meta-value")
                                ]),
                                html.Div(className="meta-card", children=[
                                    html.Span("AGE REFERENCE", className="meta-label"),
                                    html.Span("30 Chrono", className="meta-value")
                                ]),
                                html.Div(className="meta-card", children=[
                                    html.Span("ETHNICITY", className="meta-label"),
                                    html.Span("White / Caucasian", className="meta-value")
                                ])
                            ]
                        )
                    ]
                ),

                # Main Layout Split
                html.Div(
                    className="main-split",
                    children=[
                        # Left side: Unified Visualizer Panel + Live feed console
                        html.Div(
                            className="left-column",
                            children=[
                                # Unified Scan & Simulator Panel
                                html.Div(
                                    className="visualizer-panel",
                                    children=[
                                        # Title inside panel
                                        html.Div(
                                            style={"marginBottom": "24px"},
                                            children=[
                                                html.H3("Scanner de Composition Corporelle & Trajectoires de Santé", style={"fontFamily": "'Outfit', sans-serif", "color": "#ffffff", "fontSize": "18px", "fontWeight": "700", "margin": "0 0 4px 0"}),
                                                html.P("Sélectionnez une zone du corps SVG pour afficher ses analyses d'historique en temps réel. Activez la simulation à droite pour modéliser des scénarios d'entraînement.", style={"color": "#4f73a3", "fontSize": "11.5px", "margin": 0})
                                            ]
                                        ),
                                        # Flex split grid
                                        html.Div(
                                            className="visualizer-split-grid",
                                            children=[
                                                # SVG column (40% width approx)
                                                html.Div(
                                                    children=[
                                                        html.Div(
                                                            className="body-card-svg-wrapper-unified",
                                                            children=[build_unified_body_svg()]
                                                        ),
                                                        # Status indicators legend
                                                        html.Div(
                                                            style={"display": "flex", "justifyContent": "center", "gap": "14px", "marginTop": "12px", "fontSize": "10px", "fontWeight": "bold"},
                                                            children=[
                                                                html.Span([
                                                                    html.Span(style={"display": "inline-block", "width": "8px", "height": "8px", "borderRadius": "50%", "background": "#10b981", "marginRight": "5px"}),
                                                                    "Optimal"
                                                                ], style={"color": "#34d399"}),
                                                                html.Span([
                                                                    html.Span(style={"display": "inline-block", "width": "8px", "height": "8px", "borderRadius": "50%", "background": "#f59e0b", "marginRight": "5px"}),
                                                                    "Attention"
                                                                ], style={"color": "#fbbf24"}),
                                                                html.Span([
                                                                    html.Span(style={"display": "inline-block", "width": "8px", "height": "8px", "borderRadius": "50%", "background": "#ef4444", "marginRight": "5px"}),
                                                                    "Alerte"
                                                                ], style={"color": "#f87171"}),
                                                            ]
                                                        )
                                                    ],
                                                    style={"flex": "1", "minWidth": "260px", "maxWidth": "320px"}
                                                ),
                                                # Dynamic Selected Biometric Details column (60% width approx)
                                                html.Div(
                                                    className="selected-zone-analytics-column",
                                                    children=[
                                                        html.Div(id="dynamic-biometrics-panel", className="zone-info-card"),
                                                        html.Div([
                                                            dcc.Graph(
                                                                id="historical-plotly-graph",
                                                                config={"displayModeBar": False},
                                                                style={"height": "250px", "marginTop": "15px"}
                                                            )
                                                        ])
                                                    ],
                                                    style={"flex": "1.5", "minWidth": "320px"}
                                                )
                                            ]
                                        )
                                    ]
                                ),

                                # Live Console Logging
                                html.Div(
                                    className="live-feed-console",
                                    children=[
                                        html.Div("Simulator Activity Log", className="console-title"),
                                        html.Div(id="live-console-rows", className="console-logs")
                                    ]
                                )
                            ]
                        ),

                        # Right side: Scanned organs + Training Simulations panel
                        html.Div(
                            className="sidebar-panel",
                            children=[
                                html.Div(
                                    className="scanned-organs-title",
                                    children=[
                                        html.H3("Scanned Organs"),
                                        html.P("Shows Detected Organs and Live Information")
                                    ]
                                ),

                                # Organ cards
                                html.Div([
                                    # BRAIN
                                    html.Div(className="organ-card", children=[
                                        html.Div(className="organ-meta-row", children=[
                                            html.Span("BRAIN", className="organ-title")
                                        ]),
                                        html.Div(className="organ-card-body", children=[
                                            html.Div("🧠", className="organ-card-icon-box"),
                                            html.Div(className="organ-stat-row", children=[
                                                html.Span("Volume"),
                                                html.Strong("1,207 cm³")
                                            ])
                                        ])
                                    ]),
                                    # HEART
                                    html.Div(className="organ-card", style={"marginTop": "10px"}, children=[
                                        html.Div(className="organ-meta-row", children=[
                                            html.Span("HEART", className="organ-title")
                                        ]),
                                        html.Div(className="organ-card-body", children=[
                                            html.Div("❤️", className="organ-card-icon-box"),
                                            html.Div(className="organ-stat-row", children=[
                                                html.Span("Ejection Fraction"),
                                                html.Strong("45 %")
                                            ])
                                        ])
                                    ]),
                                    # LUNGS
                                    html.Div(className="organ-card", style={"marginTop": "10px"}, children=[
                                        html.Div(className="organ-meta-row", children=[
                                            html.Span("LUNGS", className="organ-title")
                                        ]),
                                        html.Div(className="organ-card-body", children=[
                                            html.Div("🫁", className="organ-card-icon-box"),
                                            html.Div(className="organ-stat-row", children=[
                                                html.Span("Volume"),
                                                html.Strong("5,094 cm³ / 6,212 cm³")
                                            ])
                                        ])
                                    ]),
                                ]),

                                # Training Simulations panel (mirrors Next.js interface)
                                html.Div(
                                    id="training-simulator-panel-container",
                                    className="simulation-panel-container",
                                    children=[
                                        # Header
                                        html.Div(
                                            className="simulation-panel-header",
                                            children=[
                                                html.Div(
                                                    className="simulation-header-text",
                                                    children=[
                                                        html.H2("Training Simulations", className="simulation-title"),
                                                        html.P("Scenario modeling & predictions", className="simulation-subtitle")
                                                    ]
                                                ),
                                                html.Button(
                                                    "🧪",
                                                    id="simulation-toggle-btn",
                                                    className="simulation-toggle-btn active",
                                                    title="Deactivate simulation",
                                                    n_clicks=0
                                                )
                                            ]
                                        ),

                                        # Inactive View
                                        html.Div(
                                            id="simulation-inactive-view",
                                            className="simulation-inactive-view",
                                            style={"display": "none"},
                                            children=[
                                                html.Div("🧪", className="simulation-inactive-icon"),
                                                html.P("Activate simulation mode to explore training scenarios", className="simulation-inactive-text"),
                                                html.Button("Enable Simulations", id="simulation-enable-btn", className="simulation-enable-btn", n_clicks=0)
                                            ]
                                        ),

                                        # Active View Container
                                        html.Div(
                                            id="simulation-active-view",
                                            className="simulation-active-view",
                                            children=[
                                                # Card S001 (Competition Preparation)
                                                html.Div(
                                                    id="scenario-card-S001",
                                                    className="scenario-card",
                                                    n_clicks=0,
                                                    children=[
                                                        html.Div(
                                                            className="scenario-main-row",
                                                            children=[
                                                                html.Div("🏆", className="scenario-icon-box bg-warning"),
                                                                html.Div(
                                                                    className="scenario-text-block",
                                                                    children=[
                                                                        html.H3("Competition Preparation", className="scenario-card-title"),
                                                                        html.P("Optimize training load for upcoming championship", className="scenario-card-desc")
                                                                    ]
                                                                ),
                                                                html.Span("▼", id="scenario-chevron-S001", className="scenario-chevron")
                                                            ]
                                                        ),
                                                        # Drawer S001
                                                        html.Div(
                                                            id="scenario-drawer-S001",
                                                            className="scenario-details-drawer",
                                                            style={"display": "none"},
                                                            children=[
                                                                html.H4("Parameters", className="drawer-section-title"),
                                                                html.Div(className="parameter-list", children=[
                                                                    html.Div(className="parameter-row", children=[
                                                                        html.Span("Training Days", className="param-label"),
                                                                        html.Span("6 days/week", className="param-value")
                                                                    ]),
                                                                    html.Div(className="parameter-row", children=[
                                                                        html.Span("Intensity", className="param-label"),
                                                                        html.Span("85%", className="param-value")
                                                                    ]),
                                                                    html.Div(className="parameter-row", children=[
                                                                        html.Span("Duration", className="param-label"),
                                                                        html.Span("4 weeks", className="param-value")
                                                                    ]),
                                                                ]),
                                                                html.H4("Predicted Outcomes", className="drawer-section-title"),
                                                                html.Div(className="outcome-mini-grid", children=[
                                                                    html.Div(className="outcome-mini-card bg-primary-light", children=[
                                                                        html.Span("Body Age", className="mini-label"),
                                                                        html.Strong("27.0 yrs", className="mini-val text-primary")
                                                                    ]),
                                                                    html.Div(className="outcome-mini-card bg-warning-light", children=[
                                                                        html.Span("Workload", className="mini-label"),
                                                                        html.Strong("88%", className="mini-val text-warning")
                                                                    ]),
                                                                    html.Div(className="outcome-mini-card bg-success-light", children=[
                                                                        html.Span("Toxins", className="mini-label"),
                                                                        html.Strong("3.2", className="mini-val text-success")
                                                                    ]),
                                                                ]),
                                                                html.Button("Apply Scenario", id="apply-btn-S001", className="apply-scenario-btn", n_clicks=0)
                                                            ]
                                                        )
                                                    ]
                                                ),

                                                # Card S002 (Injury Prevention)
                                                html.Div(
                                                    id="scenario-card-S002",
                                                    className="scenario-card",
                                                    n_clicks=0,
                                                    children=[
                                                        html.Div(
                                                            className="scenario-main-row",
                                                            children=[
                                                                html.Div("🛡️", className="scenario-icon-box bg-success"),
                                                                html.Div(
                                                                    className="scenario-text-block",
                                                                    children=[
                                                                        html.H3("Injury Prevention", className="scenario-card-title"),
                                                                        html.P("Reduce injury risk through balanced recovery", className="scenario-card-desc")
                                                                    ]
                                                                ),
                                                                html.Span("▼", id="scenario-chevron-S002", className="scenario-chevron")
                                                            ]
                                                        ),
                                                        # Drawer S002
                                                        html.Div(
                                                            id="scenario-drawer-S002",
                                                            className="scenario-details-drawer",
                                                            style={"display": "none"},
                                                            children=[
                                                                html.H4("Parameters", className="drawer-section-title"),
                                                                html.Div(className="parameter-list", children=[
                                                                    html.Div(className="parameter-row", children=[
                                                                        html.Span("Training Days", className="param-label"),
                                                                        html.Span("4 days/week", className="param-value")
                                                                    ]),
                                                                    html.Div(className="parameter-row", children=[
                                                                        html.Span("Intensity", className="param-label"),
                                                                        html.Span("65%", className="param-value")
                                                                    ]),
                                                                    html.Div(className="parameter-row", children=[
                                                                        html.Span("Recovery Days", className="param-label"),
                                                                        html.Span("3 days/week", className="param-value")
                                                                    ]),
                                                                ]),
                                                                html.H4("Predicted Outcomes", className="drawer-section-title"),
                                                                html.Div(className="outcome-mini-grid", children=[
                                                                    html.Div(className="outcome-mini-card bg-primary-light", children=[
                                                                        html.Span("Body Age", className="mini-label"),
                                                                        html.Strong("26.0 yrs", className="mini-val text-primary")
                                                                    ]),
                                                                    html.Div(className="outcome-mini-card bg-warning-light", children=[
                                                                        html.Span("Workload", className="mini-label"),
                                                                        html.Strong("58%", className="mini-val text-warning")
                                                                    ]),
                                                                    html.Div(className="outcome-mini-card bg-success-light", children=[
                                                                        html.Span("Toxins", className="mini-label"),
                                                                        html.Strong("1.8", className="mini-val text-success")
                                                                    ]),
                                                                ]),
                                                                html.Button("Apply Scenario", id="apply-btn-S002", className="apply-scenario-btn", n_clicks=0)
                                                            ]
                                                        )
                                                    ]
                                                ),

                                                # Card S003 (Performance Peak)
                                                html.Div(
                                                    id="scenario-card-S003",
                                                    className="scenario-card",
                                                    n_clicks=0,
                                                    children=[
                                                        html.Div(
                                                            className="scenario-main-row",
                                                            children=[
                                                                html.Div("⚡", className="scenario-icon-box bg-primary"),
                                                                html.Div(
                                                                    className="scenario-text-block",
                                                                    children=[
                                                                        html.H3("Performance Peak", className="scenario-card-title"),
                                                                        html.P("Maximize performance for critical event", className="scenario-card-desc")
                                                                    ]
                                                                ),
                                                                html.Span("▼", id="scenario-chevron-S003", className="scenario-chevron")
                                                            ]
                                                        ),
                                                        # Drawer S003
                                                        html.Div(
                                                            id="scenario-drawer-S003",
                                                            className="scenario-details-drawer",
                                                            style={"display": "none"},
                                                            children=[
                                                                html.H4("Parameters", className="drawer-section-title"),
                                                                html.Div(className="parameter-list", children=[
                                                                    html.Div(className="parameter-row", children=[
                                                                        html.Span("Training Days", className="param-label"),
                                                                        html.Span("5 days/week", className="param-value")
                                                                    ]),
                                                                    html.Div(className="parameter-row", children=[
                                                                        html.Span("Intensity", className="param-label"),
                                                                        html.Span("90%", className="param-value")
                                                                    ]),
                                                                    html.Div(className="parameter-row", children=[
                                                                        html.Span("Duration", className="param-label"),
                                                                        html.Span("2 weeks", className="param-value")
                                                                    ]),
                                                                ]),
                                                                html.H4("Predicted Outcomes", className="drawer-section-title"),
                                                                html.Div(className="outcome-mini-grid", children=[
                                                                    html.Div(className="outcome-mini-card bg-primary-light", children=[
                                                                        html.Span("Body Age", className="mini-label"),
                                                                        html.Strong("28.0 yrs", className="mini-val text-primary")
                                                                    ]),
                                                                    html.Div(className="outcome-mini-card bg-warning-light", children=[
                                                                        html.Span("Workload", className="mini-label"),
                                                                        html.Strong("92%", className="mini-val text-warning")
                                                                    ]),
                                                                    html.Div(className="outcome-mini-card bg-success-light", children=[
                                                                        html.Span("Toxins", className="mini-label"),
                                                                        html.Strong("3.5", className="mini-val text-success")
                                                                    ]),
                                                                ]),
                                                                html.Button("Apply Scenario", id="apply-btn-S003", className="apply-scenario-btn", n_clicks=0)
                                                            ]
                                                        )
                                                    ]
                                                ),

                                                # Custom Scenario Card
                                                html.Div(
                                                    id="scenario-card-custom",
                                                    className="scenario-card border-dashed",
                                                    n_clicks=0,
                                                    children=[
                                                        html.Div(
                                                            className="scenario-main-row",
                                                            children=[
                                                                html.Div("+", className="scenario-icon-box bg-neutral-light"),
                                                                html.Div(
                                                                    className="scenario-text-block",
                                                                    children=[
                                                                        html.H3("Create Custom Scenario", className="scenario-card-title"),
                                                                        html.P("Configure personalized workload parameters", className="scenario-card-desc")
                                                                    ]
                                                                ),
                                                                html.Span("▼", id="scenario-chevron-custom", className="scenario-chevron")
                                                            ]
                                                        ),
                                                        # Drawer Custom
                                                        html.Div(
                                                            id="scenario-drawer-custom",
                                                            className="scenario-details-drawer",
                                                            style={"display": "none"},
                                                            children=[
                                                                html.H4("Custom Sliders", className="drawer-section-title"),
                                                                html.Div(
                                                                    className="custom-sliders-box",
                                                                    children=[
                                                                        html.Div([
                                                                            html.Div([
                                                                                html.Span("Intensité d'Entraînement", className="slider-label-text"),
                                                                                html.Span(id="custom-intensity-label", className="slider-val-text")
                                                                            ], className="slider-header-row"),
                                                                            dcc.Slider(id="custom-intensity", min=50, max=100, step=5, value=75, className="custom-dash-slider")
                                                                        ], className="custom-slider-container"),
                                                                        html.Div([
                                                                            html.Div([
                                                                                html.Span("Fréquence Hebdomadaire", className="slider-label-text"),
                                                                                html.Span(id="custom-frequency-label", className="slider-val-text")
                                                                            ], className="slider-header-row"),
                                                                            dcc.Slider(id="custom-frequency", min=1, max=7, step=1, value=4, className="custom-dash-slider")
                                                                        ], className="custom-slider-container"),
                                                                        html.Div([
                                                                            html.Div([
                                                                                html.Span("Durée du Programme", className="slider-label-text"),
                                                                                html.Span(id="custom-duration-label", className="slider-val-text")
                                                                            ], className="slider-header-row"),
                                                                            dcc.Slider(id="custom-duration", min=1, max=12, step=1, value=6, className="custom-dash-slider")
                                                                        ], className="custom-slider-container")
                                                                    ]
                                                                ),
                                                                html.H4("Predicted Outcomes", className="drawer-section-title"),
                                                                html.Div(className="outcome-mini-grid", children=[
                                                                    html.Div(className="outcome-mini-card bg-primary-light", children=[
                                                                        html.Span("Body Age", className="mini-label"),
                                                                        html.Strong(id="custom-outcome-body-age", className="mini-val text-primary")
                                                                    ]),
                                                                    html.Div(className="outcome-mini-card bg-warning-light", children=[
                                                                        html.Span("Workload", className="mini-label"),
                                                                        html.Strong(id="custom-outcome-workload", className="mini-val text-warning")
                                                                    ]),
                                                                    html.Div(className="outcome-mini-card bg-success-light", children=[
                                                                        html.Span("Toxins", className="mini-label"),
                                                                        html.Strong(id="custom-outcome-toxins", className="mini-val text-success")
                                                                    ]),
                                                                ]),
                                                                html.Button("Apply Custom Scenario", id="apply-btn-custom", className="apply-scenario-btn", n_clicks=0)
                                                            ]
                                                        )
                                                    ]
                                                ),
                                            ]
                                        )
                                    ]
                                )
                            ]
                        )
                    ]
                )
            ]
        )
    ]
)

# ═══════════════════════════════════════════════════════════════════════
# DASH CONTROLLERS AND CALLBACKS
# ═══════════════════════════════════════════════════════════════════════

# 1. Callback to toggle simulation active state store
@app.callback(
    Output("simulation-active-store", "data"),
    Output("simulation-toggle-btn", "className"),
    Output("simulation-toggle-btn", "title"),
    Input("simulation-toggle-btn", "n_clicks"),
    Input("simulation-enable-btn", "n_clicks"),
    State("simulation-active-store", "data"),
    prevent_initial_call=True
)
def toggle_simulation_active(n_toggle, n_enable, current_active):
    ctx = dash.callback_context
    if not ctx.triggered:
        return current_active, "simulation-toggle-btn active" if current_active else "simulation-toggle-btn", "Deactivate simulation" if current_active else "Activate simulation"
    
    new_active = not current_active
    btn_class = "simulation-toggle-btn active" if new_active else "simulation-toggle-btn"
    btn_title = "Deactivate simulation" if new_active else "Activate simulation"
    return new_active, btn_class, btn_title

# 2. Callback to toggle views based on simulator active store
@app.callback(
    Output("simulation-active-view", "style"),
    Output("simulation-inactive-view", "style"),
    Input("simulation-active-store", "data")
)
def toggle_simulation_views(is_active):
    if is_active:
        return {"display": "block"}, {"display": "none"}
    else:
        return {"display": "none"}, {"display": "block"}

# 3. Callback to expand/collapse scenario cards
@app.callback(
    Output("expanded-scenario-store", "data"),
    Input("scenario-card-S001", "n_clicks"),
    Input("scenario-card-S002", "n_clicks"),
    Input("scenario-card-S003", "n_clicks"),
    Input("scenario-card-custom", "n_clicks"),
    State("expanded-scenario-store", "data"),
    prevent_initial_call=True
)
def handle_card_expansion(c1, c2, c3, cc, current_expanded):
    ctx = dash.callback_context
    if not ctx.triggered:
        return current_expanded
    
    trigger_id = ctx.triggered[0]["prop_id"].split(".")[0]
    clicked = trigger_id.replace("scenario-card-", "")
    
    if clicked == current_expanded:
        return ""
    return clicked

# 4. Callback to update chevrons and drawers based on expanded-scenario-store
@app.callback(
    Output("scenario-drawer-S001", "style"),
    Output("scenario-drawer-S002", "style"),
    Output("scenario-drawer-S003", "style"),
    Output("scenario-drawer-custom", "style"),
    Output("scenario-chevron-S001", "children"),
    Output("scenario-chevron-S002", "children"),
    Output("scenario-chevron-S003", "children"),
    Output("scenario-chevron-custom", "children"),
    Input("expanded-scenario-store", "data")
)
def update_drawers_visibility(expanded_val):
    styles = []
    chevrons = []
    for code in ["S001", "S002", "S003", "custom"]:
        if expanded_val == code:
            styles.append({"display": "block"})
            chevrons.append("▲")
        else:
            styles.append({"display": "none"})
            chevrons.append("▼")
    return styles[0], styles[1], styles[2], styles[3], chevrons[0], chevrons[1], chevrons[2], chevrons[3]

# 5. Callback to update applied scenario store
@app.callback(
    Output("applied-scenario-store", "data"),
    Input("apply-btn-S001", "n_clicks"),
    Input("apply-btn-S002", "n_clicks"),
    Input("apply-btn-S003", "n_clicks"),
    Input("apply-btn-custom", "n_clicks"),
    State("applied-scenario-store", "data"),
    prevent_initial_call=True
)
def apply_scenario(btn1, btn2, btn3, btn_c, current_applied):
    ctx = dash.callback_context
    if not ctx.triggered:
        return current_applied
    
    trigger_id = ctx.triggered[0]["prop_id"].split(".")[0]
    scenario_code = trigger_id.replace("apply-btn-", "")
    return scenario_code

# 6. Callback to set CSS classes on scenario cards based on applied-scenario-store
@app.callback(
    Output("scenario-card-S001", "className"),
    Output("scenario-card-S002", "className"),
    Output("scenario-card-S003", "className"),
    Output("scenario-card-custom", "className"),
    Input("applied-scenario-store", "data")
)
def update_card_classes(applied_val):
    c1 = "scenario-card applied" if applied_val == "S001" else "scenario-card"
    c2 = "scenario-card applied" if applied_val == "S002" else "scenario-card"
    c3 = "scenario-card applied" if applied_val == "S003" else "scenario-card"
    cc = "scenario-card border-dashed applied" if applied_val == "custom" else "scenario-card border-dashed"
    return c1, c2, c3, cc

# 7. Callback to update custom slider labels and custom predicted outcomes
@app.callback(
    Output("custom-intensity-label", "children"),
    Output("custom-frequency-label", "children"),
    Output("custom-duration-label", "children"),
    Output("custom-outcome-body-age", "children"),
    Output("custom-outcome-workload", "children"),
    Output("custom-outcome-toxins", "children"),
    Input("custom-intensity", "value"),
    Input("custom-frequency", "value"),
    Input("custom-duration", "value"),
)
def update_custom_predictions(intensity, frequency, duration):
    intensity_label = f"{intensity}%"
    frequency_label = f"{frequency} j/sem"
    duration_label = f"{duration} sem"
    
    chrono_age = 30.0
    workload = intensity * frequency * 0.12
    toxins = (intensity * 0.04) + (frequency * 0.35) - (duration * 0.18)
    toxins = max(0.5, min(10.0, toxins))
    
    age_delta = -1.0
    age_delta -= (frequency * 0.3)
    age_delta -= (duration * 0.22)
    if workload > 60:
        age_delta += (workload - 60) * 0.25
    elif workload < 25:
        age_delta += (25 - workload) * 0.08
        
    sim_age = chrono_age + age_delta
    sim_age = max(24.0, min(40.0, sim_age))
    
    return (
        intensity_label,
        frequency_label,
        duration_label,
        f"{sim_age:.1f} yrs",
        f"{workload:.1f}%",
        f"{toxins:.1f}/10"
    )

SCENARIO_MAP = {
    "S001": {"intensity": 85, "frequency": 6, "duration": 4},
    "S002": {"intensity": 65, "frequency": 4, "duration": 6},
    "S003": {"intensity": 90, "frequency": 5, "duration": 2},
}

# 8. Live Simulator Interval Callback: triggers live telemetry updates matching slider/scenario context
@app.callback(
    Output("live-biometrics-store", "data"),
    Output("console-logs-store", "data"),
    Input("simulator-interval-trigger", "n_intervals"),
    Input("applied-scenario-store", "data"),
    Input("custom-intensity", "value"),
    Input("custom-frequency", "value"),
    Input("custom-duration", "value"),
    Input("simulation-active-store", "data"),
    State("live-biometrics-store", "data"),
    State("console-logs-store", "data")
)
def run_live_simulation(n_intervals, applied_scenario, custom_intensity, custom_frequency, custom_duration, is_simulation_active, current_biometrics, logs):
    if not current_biometrics:
        current_biometrics = get_current_mock_biometrics()
        
    if not logs:
        logs = []
    
    # Determine scenario params
    if not is_simulation_active:
        intensity = 60
        frequency = 3
        duration = 4
        scenario_name = "Baseline Feed"
    else:
        if applied_scenario in SCENARIO_MAP:
            params = SCENARIO_MAP[applied_scenario]
            intensity = params["intensity"]
            frequency = params["frequency"]
            duration = params["duration"]
            scenario_names = {
                "S001": "Competition Prep",
                "S002": "Injury Prevention",
                "S003": "Performance Peak"
            }
            scenario_name = scenario_names.get(applied_scenario, "Preset")
        else:
            intensity = custom_intensity
            frequency = custom_frequency
            duration = custom_duration
            scenario_name = "Custom Simulation"
            
    # Calculate physiological baselines based on these active params
    workload_base = intensity * frequency * 0.12
    
    # Brain: cognitive load center increases with intensity/workload
    brain_center = 16.0 + workload_base * 0.3
    new_brain = max(10.0, min(80.0, brain_center + random.uniform(-1.5, 1.5)))
    
    # Heart: HR center increases with intensity & frequency
    hr_center = 58.0 + (intensity - 50) * 0.45 + (frequency * 1.2)
    new_hr = max(45.0, min(140.0, hr_center + random.uniform(-2.5, 2.5)))
    
    # Lungs: SpO2 remains near optimal, slightly lower with maximum intensity
    lungs_center = 99.6 - (intensity * 0.015)
    new_lungs = max(90.0, min(100.0, lungs_center + random.uniform(-0.3, 0.3)))
    
    # Liver: Toxin Index center increases with high intensity, but clears with longer duration
    toxin_center = 0.4 + (intensity * 0.025) + (frequency * 0.15) - (duration * 0.1)
    new_liver = max(0.1, min(6.0, toxin_center + random.uniform(-0.1, 0.1)))
    
    # Left & Right arm muscle load: increases with intensity
    arm_center = 32.0 + (intensity - 50) * 0.75
    new_larm = max(10.0, min(95.0, arm_center + random.uniform(-3.0, 3.0)))
    new_rarm = max(10.0, min(95.0, arm_center * 1.08 + random.uniform(-3.0, 3.0)))
    
    # Core Posture: improves with duration, slightly declines under over-training
    core_center = 74.0 + duration * 1.3 - (intensity * frequency * 0.02)
    new_core = max(40.0, min(100.0, core_center + random.uniform(-1.0, 1.0)))
    
    # Left & Right leg mobility: improves with duration, decreases slightly with high frequency (fatigue)
    leg_center = 68.0 + duration * 1.1 - (frequency * 1.0)
    new_lleg = max(40.0, min(100.0, leg_center + random.uniform(-1.0, 1.0)))
    new_rleg = max(40.0, min(100.0, leg_center + random.uniform(-1.0, 1.0)))

    new_biometrics = {
        "brain": new_brain,
        "heart": new_hr,
        "lungs": new_lungs,
        "liver": new_liver,
        "leftArm": new_larm,
        "rightArm": new_rarm,
        "core": new_core,
        "leftLeg": new_lleg,
        "rightLeg": new_rleg,
    }
    
    # Log variations
    t_str = datetime.now().strftime("%H:%M:%S")
    log_row = f"[{t_str}] Telemetry mode: {scenario_name} | Heart Rate: {new_biometrics['heart']:.1f} BPM | SpO2: {new_biometrics['lungs']:.1f}% | Workload: {workload_base:.1f}"
    
    logs.insert(0, {"text": log_row, "alert": False})
    if len(logs) > 25:
        logs.pop()
        
    return new_biometrics, logs

# 4. Click Handler: receives clicks on the SVG interactive groups
@app.callback(
    Output("selected-zone-store", "data"),
    [Input("brain-group", "n_clicks"),
     Input("heart-group", "n_clicks"),
     Input("lungs-group", "n_clicks"),
     Input("liver-group", "n_clicks"),
     Input("core-group", "n_clicks"),
     Input("leftArm-group", "n_clicks"),
     Input("rightArm-group", "n_clicks"),
     Input("leftLeg-group", "n_clicks"),
     Input("rightLeg-group", "n_clicks")]
)
def manage_zone_click(brain_c, heart_c, lungs_c, liver_c, core_c, l_arm_c, r_arm_c, l_leg_c, r_leg_c):
    ctx = dash.callback_context
    if not ctx.triggered:
        return "heart"
    
    trigger_id = ctx.triggered[0]["prop_id"].split(".")[0]
    zone_id = trigger_id.split("-")[0] # Extract "brain", "heart", etc.
    
    # Validate clicked component matches valid zone
    if zone_id in ZONE_CONFIG:
        return zone_id
    return "heart"

# 5. Dynamic SVG visual update: modifies color, opacity, tooltips, and selections
svg_outputs = []
for z_key in ZONE_CONFIG.keys():
    svg_outputs.append(Output(f"{z_key}-path", "style"))
    svg_outputs.append(Output(f"{z_key}-dot", "style"))
    svg_outputs.append(Output(f"{z_key}-title", "children"))

@app.callback(
    svg_outputs,
    Input("live-biometrics-store", "data"),
    Input("selected-zone-store", "data")
)
def update_svg_visuals(biometrics, selected_zone):
    if not biometrics:
        biometrics = get_current_mock_biometrics()
        
    results = []
    thresholds_for_normalizing = {
        "brain": (10.0, 60.0),
        "heart": (45.0, 120.0),
        "lungs": (90.0, 100.0),
        "liver": (0.0, 5.0),
        "leftArm": (20.0, 95.0),
        "rightArm": (20.0, 95.0),
        "core": (40.0, 100.0),
        "leftLeg": (40.0, 100.0),
        "rightLeg": (40.0, 100.0),
    }
    
    for zone in ZONE_CONFIG.keys():
        config = ZONE_CONFIG[zone]
        val = biometrics.get(zone, 50.0)
        status = get_zone_status(val, zone)
        pal = STATUS_PALETTE[status]
        
        # Calculate dynamic opacity: more extreme/higher values are more saturated
        v_min, v_max = thresholds_for_normalizing.get(zone, (0.0, 100.0))
        norm_val = (val - v_min) / (v_max - v_min) if v_max > v_min else 0.5
        norm_val = max(0.0, min(1.0, norm_val))
        fill_opacity = 0.15 + 0.65 * norm_val
        
        is_selected = (zone == selected_zone)
        
        # Saturated flat color + selection stroke + drop shadow glow
        path_style = {
            "fill": pal["base"],
            "fillOpacity": fill_opacity,
            "stroke": "#ffffff" if is_selected else pal["stroke"],
            "strokeWidth": "2px" if is_selected else "1px",
            "filter": f"drop-shadow(0px 0px 10px {pal['glow']})" if is_selected else f"drop-shadow(0px 0px 4px {pal['glow']})",
            "transition": "all 0.25s ease",
            "cursor": "pointer"
        }
        
        # Circle indicator
        dot_style = {
            "fill": pal["base"],
            "stroke": pal["ring"],
            "strokeWidth": "1.5px",
            "r": 5.5 if is_selected else 3.5,
            "transition": "all 0.25s ease"
        }
        
        # Title tooltip for browser hovering
        tooltip_content = f"{config['paramLabel']}: {val:.1f}{config['unit']} ({status.upper()}) | Norm: {config['normal_range'][0]}-{config['normal_range'][1]}{config['unit']}"
        
        results.extend([path_style, dot_style, tooltip_content])
        
    return results

# 6. Dynamic Sidebar Panel render: updates descriptions, Plotly chart, and console logs
@app.callback(
    Output("dynamic-biometrics-panel", "children"),
    Output("historical-plotly-graph", "figure"),
    Output("live-console-rows", "children"),
    Input("selected-zone-store", "data"),
    Input("live-biometrics-store", "data"),
    Input("console-logs-store", "data")
)
def update_sidebar_panel(selected_zone, biometrics, logs):
    if not biometrics:
        biometrics = get_current_mock_biometrics()
        
    config = ZONE_CONFIG[selected_zone]
    current_val = biometrics.get(selected_zone, 50.0)
    
    status = get_zone_status(current_val, selected_zone)
    colors = STATUS_PALETTE[status]
    
    # 6.1 Draw select zone details card
    ui_card = html.Div([
        html.Div(
            className="zone-info-header",
            children=[
                html.Span(config["icon"]),
                html.H4(config["label"])
            ]
        ),
        html.Div(
            className="zone-info-value-block",
            children=[
                html.Div(
                    className="big-value",
                    children=[
                        f"{current_val:.1f}",
                        html.Span(config["unit"])
                    ],
                    style={"color": colors["stroke"]}
                ),
                html.Div(colors["label"], className="status-badge", style={
                    "background": colors["bg"],
                    "color": colors["stroke"],
                    "borderColor": colors["stroke"]
                })
            ]
        ),
        html.P(config["description"])
    ])

    # 6.2 Draw customized Plotly chart
    plotly_fig = generate_plotly_history(selected_zone, current_val)

    # 6.3 Draw console log rows
    console_rows = []
    for log in logs:
        console_rows.append(html.Div(
            className="console-log-row",
            children=[
                html.Span(log["text"]),
                html.Span("✓ RECEIVED", style={"color": "#00FF9D"})
            ]
        ))

    return ui_card, plotly_fig, console_rows

# 9. Cleaned up obsolete outcomes callback

# ═══════════════════════════════════════════════════════════════════════
# EXECUTION ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("Starting Premium Clinical-Grade Python Body Analytics Dashboard...")
    print("Dashboard serving at http://127.0.0.1:8050")
    app.run(debug=True, port=8050)
