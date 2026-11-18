import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, hex_color):
    tcPr = cell._element.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_specifications_document(output_path):
    doc = docx.Document()

    for section in doc.sections:
        section.top_margin = Inches(0.65)
        section.bottom_margin = Inches(0.65)
        section.left_margin = Inches(0.65)
        section.right_margin = Inches(0.65)

    # Document Header
    p_title = doc.add_paragraph()
    r_title = p_title.add_run("AXONA FLEET MANAGEMENT — CORE SPECIFICATIONS & LOGIC MATRIX")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(17)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(2)

    p_sub = doc.add_paragraph()
    r_sub = p_sub.add_run("Complete Reference of Algorithms, Formulas, Mathematical Logics, State Machines & Protocols Across All Features")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(10.5)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(71, 85, 105)
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(14)

    # Metadata Summary Bar
    meta_table = doc.add_table(rows=1, cols=4)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_items = [
        ("Platform Version", "Axona Enterprise SaaS v2.4"),
        ("Regulatory Standard", "MoRTH AIS-140 / ARAI"),
        ("Spatial Computation", "WGS-84 / Spherical Earth"),
        ("State Engines", "12 Production Modules")
    ]
    for i, (k, v) in enumerate(meta_items):
        cell = meta_table.cell(0, i)
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        rk = p.add_run(f"{k}\n")
        rk.font.size = Pt(8)
        rk.font.bold = True
        rk.font.color.rgb = RGBColor(100, 116, 139)
        rv = p.add_run(v)
        rv.font.size = Pt(9)
        rv.font.bold = True
        rv.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Overview Text
    p_intro = doc.add_paragraph()
    r_intro = p_intro.add_run("Technical Architecture Overview: ")
    r_intro.font.bold = True
    r_intro.font.color.rgb = RGBColor(15, 23, 42)
    p_intro.add_run(
        "This engineering reference documents the mathematical formulas, algorithmic state transitions, "
        "sensor calibration rules, and statutory integration logics governing every functional capability in the "
        "Axona Fleet Management Platform. Designed for commercial and industrial fleets compliant with Indian MoRTH AIS-140 mandate."
    )
    p_intro.paragraph_format.space_after = Pt(12)

    # Specifications Table
    # Columns: Feature / Module, Mathematical Formula & Core Algorithm, Calibration Standards & Thresholds, State Machine & Logic Flow, Safety, Fail-Safe & UX Output
    features = [
        (
            "1. Real-Time Vehicle Motion State Engine",
            "Speed-Ignition Vector Matrix:\n• v > 3.0 km/h → Moving\n• v <= 3.0 km/h & IGN=1 → Idle\n• v <= 3.0 km/h & IGN=0 → Stopped\n• Delta_t > 600s → Offline\n• v > 5.0 km/h & IGN=0 → Towing",
            "• Moving Threshold: 3.0 km/h\n• Towing Trigger: > 5.0 km/h\n• GPS Heartbeat Ping: 4s moving, 600s stationary\n• GPS Drift Filter: < 1.5 km/h ignored",
            "Inputs: Raw GPS speed (km/h) and Digital Input 1 (Ignition status).\n1. Check external power and GNSS fix.\n2. Filter multipath GPS noise.\n3. Update movement_status in latest_vehicle_locations.\n4. Broadcast state via WebSocket.",
            "• Fail-safe: Prevents false stationary reporting during GPS jitter.\n• UX Output: Color-coded map markers (Green=Moving, Orange=Idle, Blue=Stopped, Red=Emergency/Towing)."
        ),
        (
            "2. AIS-140 Packet Parser & Ingestion Engine",
            "Bitwise XOR Hex Checksum:\nCS = XOR(chars between '$' and '*')\nAnti-Duplicate Hash:\nKey = MD5(IMEI + Lat + Lon + Speed)\nTime-Window Cache: 2000 ms debounce",
            "• Packet Header: $PVT, $ALT, $SOS\n• NMEA Field Count: >= 16 fields\n• Latitude Range: -90.0° to +90.0°\n• Longitude Range: -180.0° to +180.0°\n• Satellites Required: >= 4 (GNSS fix)",
            "1. Strip '$' header and isolate 2-character hex checksum.\n2. Validate parity.\n3. Check duplicate cache (drop redundant packets < 2s).\n4. Match IMEI in gps_devices table.\n5. Log raw payload into raw_packet_logs for ARAI compliance audit.",
            "• Fail-Safe: Malformed packets returned as $NAK,IMEI,INVALID_FORMAT*FF without crashing server.\n• UX Output: Instant telemetry ingestion (< 50ms) streamed to Live Map."
        ),
        (
            "3. Geofencing: Haversine & Ray-Casting Engine",
            "1. Circular Geofence (Haversine Formula):\na = sin²(dLat/2) + cos(lat1)*cos(lat2)*sin²(dLon/2)\nd = 2 * R * atan2(sqrt(a), sqrt(1-a))\nWhere Earth Radius R = 6,371,000 meters.\n\n2. Arbitrary Polygon (Ray-Casting Algorithm):\nIntersect test along horizontal ray: ((y_i > y) != (y_j > y)) && (x < (x_j - x_i)*(y - y_i)/(y_j - y_i) + x_i)",
            "• Circle Precision: Tested within radius_meters.\n• Polygon Vertices: Closed coordinate array [[lat, lon], ...].\n• Speed Constraint: Localized fence speed limit (e.g. 20 km/h in yard).",
            "1. Evaluate on every GPS packet.\n2. Query previous state in geofence_events.\n3. If isInside & !wasInside → Generate ENTRY event.\n4. If !isInside & wasInside → Generate EXIT event.\n5. If speed > fence.speed_limit → Generate GEO_OVERSPEED.",
            "• Fail-Safe: Debounces boundary jitter to prevent flip-flopping.\n• UX Output: Full-screen modal popup with dual-tone chime (554-830 Hz) on breach; 1-click Live Map transition."
        ),
        (
            "4. Driver Intelligence & Behavioral Safety Scoring",
            "Fleet Safety Score Deduction Formula:\nScore = max(30, min(100, round(100 - (HB*3 + HA*2 + TI*10 + RD*5 + OS*2))))\n\nWhere:\n• HB = Harsh Braking incidents\n• HA = Harsh Acceleration incidents\n• TI = Vehicle Tilt incidents\n• RD = Rash Driving incidents\n• OS = Overspeeding incidents",
            "ARAI tnavIC Calibration Limits:\n• Harsh Braking (HBT): >= 0.55g deceleration\n• Harsh Accel (HAT): >= 0.43g forward pickup\n• Vehicle Tilt (TA): >= 45.0° roll angle\n• Rash Turning (RTT/HTA): >= 30 km/h with >= 0.47g lateral centripetal swerve\n• Speed Limit (SL): Configurable (65-80 km/h)",
            "1. Ingest $ALT packet or sample device 3-axis MEMS sensor.\n2. Compare measured value against device_imu_configs.\n3. Categorize into WARNING or CRITICAL based on threshold delta.\n4. Update running 90-day driver intelligence ledger.\n5. Recompute dynamic driver safety score.",
            "• Fail-Safe: Ignores pothole spikes < 0.15s to eliminate false road bumps.\n• UX Output: Driver scorecard (0-100), visual G-force meters, and automated safety audit rankings."
        ),
        (
            "5. Remote Vehicle Immobilisation Safety Architecture",
            "Starter Circuit Interruption Matrix:\nCan_Immobilise = (PIN_Valid == True) AND (Speed == 0.0 km/h) AND (Movement_Status != 'moving') AND (Device_Status == 'online')\n\nSpeed Safety Gate: Speed MUST be strictly 0.0 km/h",
            "• Zero-Speed Requirement: 0.0 km/h (Strict)\n• Verification Window: Stationary for >= 10s\n• Relay Type: Starter Motor Relay (Crank Signal)\n• 2FA PIN: 4-Digit encrypted security PIN\n• Audit Retention: Permanent immutable log",
            "1. User initiates 'Immobilise' and enters 4-digit PIN.\n2. Server verifies PIN against bcrypt hash.\n3. Server queries latest_vehicle_locations speed.\n4. IF SPEED > 0.0 km/h: Command rejected; logged as SAFETY_VIOLATION_VEHICLE_MOVING.\n5. IF SPEED == 0.0 km/h: Relay open command dispatched; vehicle starter crank locked.",
            "• Life Safety Guarantee: NEVER cuts fuel pump or engine ignition while driving on highways; only prevents starter restart when parked.\n• UX Output: Status badge 'IMMOBILISED', red shield on Live Map."
        ),
        (
            "6. 24/7 Panic SOS Emergency Response Protocol",
            "Emergency Escalation State Machine:\nNew → Acknowledged → In Progress → Resolved → Closed\nEscalation Rule:\nIF State == 'New' AND Elapsed_Time > 900s → Escalate to Level 2 Management",
            "• Physical Interrupt: Hardware button pressed\n• Audio Siren: 800 Hz ⟷ 960 Hz alternating tone\n• Latency Target: < 500 ms delivery to NOC\n• SMS Gateway: Dispatches within 3s to emergency contacts",
            "1. Hardware button pulls Digital Input HIGH.\n2. Device immediately formats $SOS packet.\n3. Server creates record in panic_events with status 'New'.\n4. WebSocket pushes emergency interrupt to all active mobile clients.\n5. Top screen banner flashes red and Web Audio siren sounds.",
            "• Fail-Safe: Operates on internal backup battery even if vehicle battery is severed.\n• UX Output: Audible emergency siren, flashing red persistent top banner, 1-tap dialer for emergency contacts."
        ),
        (
            "7. Trip History & Breadcrumb Reconstruction",
            "Haversine Cumulative Distance Integration:\nTotal_Distance = SUM(Haversine(Waypoint[i], Waypoint[i+1]))\nAverage Speed Formula:\nAvg_Speed = Total_Distance / Moving_Duration_Hours\nStoppage Cluster Algorithm:\nCluster when delta_distance < 20m for delta_time >= 180s",
            "• Stoppage Threshold: Stationary >= 3 minutes\n• Max 90-Day Time Horizon per MoRTH mandate\n• Route Sampling: 10,000 indexed records per query\n• GPS Waypoint Retention: 90 days indexed storage",
            "1. User queries date preset ('Today', '7 Days', '30 Days', '90 Days').\n2. System fetches chronologically ordered waypoints from gps_location_history.\n3. Reconstructs polyline breadcrumbs.\n4. Identifies stop clusters and idle intervals.\n5. Renders trip segment breakdown with max speed and stoppage pins.",
            "• Fail-Safe: Filters out satellite jumps > 150 km/h.\n• UX Output: Interactive OSM map playback, elevation & speed charts, and 1-click CSV export."
        ),
        (
            "8. Statutory VAHAN 4.0 & Sarathi 4.0 Verification",
            "Transport DL Expiry Countdown:\nDays_Remaining = floor((Expiry_Date - Current_Date) / 86400000)\nStatus Classification:\n• Days > 30 → VALID / ACTIVE (Green)\n• 0 <= Days <= 30 → RENEWAL DUE (Yellow)\n• Days < 0 → EXPIRED / UNLICENSED (Red)",
            "• VAHAN Parameters: 9 Central Statutory Checks\n• Parivahan Portal: MoRTH e-Challan REST API\n• DL Verification: 2-Factor Auth (DL # + DOB)\n• Compliance Horizon: 24-hour automated re-audit",
            "1. Query vehicle registration against VAHAN central registry.\n2. Fetch active e-Challan records, unpaid amounts, and offense codes.\n3. Validate Fitness Certificate (ATS), Insurance (IIB), and PUC (CPCB).\n4. In DL mode: Authenticate driver DL # and DOB against Sarathi 4.0.\n5. Verify commercial transport endorsement (TRANS/LMV-TR) and badge.",
            "• Fail-Safe: Graceful fallback to cached statutory audit if Parivahan portal experiences downtime.\n• UX Output: Unified single-view compliance dossier and granular challan breakdown."
        ),
        (
            "9. Executive Fleet KPI Aggregation Engine",
            "Fleet Utilization Percentage:\nUtilization_% = ((Moving_Assets + Idle_Assets) / Total_Fleet_Assets) * 100\nCumulative Fleet Daily Distance:\nDaily_Distance_km = SUM(Distance traveled by all active vehicles since 00:00 UTC)",
            "• Real-Time Polling: Every 5-10s background sync\n• Active Assets: Minimum 1 valid GPS fix in last 24h\n• Fleet Safety Index: Weighted average of all vehicle scores\n• 7 Asset Segment Support: Truck, Bus, Car, Taxi, EV, Van, Equipment",
            "1. Aggregate current status across latest_vehicle_locations.\n2. Calculate moving, idle, stopped, and offline asset counts.\n3. Sum daily distance counter across all operational trips.\n4. Compute real-time utilization metric.\n5. Push KPI cards to Executive Dashboard.",
            "• Fail-Safe: Caches last known KPI aggregates during brief network interruptions.\n• UX Output: Glanceable KPI cards with percentage indicators and active fleet counters."
        ),
        (
            "10. Device Health & Telemetry Power Monitoring",
            "Dual-Power Failover Logic:\nIF Main_Power_Voltage < 9.0V THEN:\n  Set Main_Power_Connected = 0\n  Switch to Internal Li-ion Backup Battery\n  Trigger 'power_disconnect' critical health event\nIF Backup_Battery_Pct < 20% THEN:\n  Trigger 'low_battery' warning",
            "• Main Power Operating Range: 9V - 36V DC\n• Backup Battery Run Time: Minimum 4.0 hours\n• Low Battery Threshold: < 20% capacity\n• Casing Micro-Switch: Trigger on physical enclosure breach\n• Satellite Fix Threshold: Min 4 satellites (HDOP < 2.0)",
            "1. Device measures analog voltage on main vehicle battery line.\n2. Evaluates enclosure physical micro-switch.\n3. Checks GNSS satellite lock count.\n4. Formats health telemetry bits in $PVT packet.\n5. Server updates gps_devices status and logs critical power cuts.",
            "• Fail-Safe: Unit continues transmitting location pings on internal battery during vehicle theft power-cut.\n• UX Output: Device Health status card with battery %, satellite count, and tamper switch alarms."
        ),
        (
            "11. Multi-Tenant RBAC & Cryptographic Security",
            "Multi-Tenant Partition Filter:\nWHERE tenant_id = CURRENT_USER.tenant_id\n(Super Admin bypassed: WHERE 1=1)\nPassword Cryptography:\nHash = bcrypt(Password, SaltRounds=10)\nJWT Session Validation:\nToken = HMAC_SHA256(Payload, JWT_SECRET, expiresIn='24h')",
            "• Role Hierarchy: super_admin > company_admin > fleet_manager > driver\n• Session Expiry: 24 Hours with automatic token refresh\n• PIN Encryption: 4-digit hashed remote authorization PIN\n• Audit Logging: IP address, user ID, timestamp recorded",
            "1. Incoming HTTP/WS request carries Bearer JWT.\n2. Authentication middleware validates cryptographic signature.\n3. Injects tenant_id into request context.\n4. Database queries automatically inject tenant boundary condition.\n5. Prohibits cross-tenant data leakage.",
            "• Security Guarantee: Total isolation between competing commercial fleet enterprises.\n• UX Output: Customized company branding, role-tailored navigation permissions."
        ),
        (
            "12. Real-Time Web Audio Alert Synthesis Engine",
            "Direct Web Audio Oscillators:\n• SOS: Sawtooth alternating 800 Hz ⟷ 960 Hz\n• Towing: Square wave 680 Hz triple-pulse (0.24s spacing)\n• Tilt: Triangle down-sweep 1250 Hz → 750 Hz\n• Geofence: Dual sine chime 554 Hz (C#5) → 830 Hz (G#5)\n\nZero-JS-Timer Scheduling:\nAll tones scheduled via AudioContext.currentTime",
            "• Web Audio API: 100% native browser hardware scheduling\n• Sound Duration: Exactly 0.6s to 1.0s (non-looping)\n• Volume Envelope: Exponential ramp down to 0.001 (clickless)\n• Event Loop Overhead: 0 milliseconds (Thread idle)",
            "1. Critical alert triggered via WebSocket or user action.\n2. Store calls soundService.playAlertSound(type).\n3. Audio context schedules oscillator frequency and gain envelopes natively on audio thread.\n4. Plays crisp auditory chime without touching JS event loop.\n5. Allows Playwright and UI interactions to respond instantly without thread blocking.",
            "• Fail-Safe: Works without external audio file downloads; falls back to native haptics on iOS/Android.\n• UX Output: Instant audible feedback, sound toggle button (Sound ON / Muted)."
        )
    ]

    # Create Table
    col_widths = [Inches(1.1), Inches(1.8), Inches(1.4), Inches(1.8), Inches(1.4)]
    table = doc.add_table(rows=1, cols=5)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    headers = [
        "Feature / Module",
        "Mathematical Formula & Core Algorithm",
        "Calibration Standards & Thresholds",
        "State Machine & Logic Flow",
        "Safety, Fail-Safe & UX Output"
    ]

    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "0F172A") # Deep Navy
        set_cell_margins(hdr_cells[i], 120, 120, 100, 100)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(title)
        r.font.name = "Calibri"
        r.font.size = Pt(9.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    for idx, (mod, formula, thresh, logic, ux) in enumerate(features):
        row = table.add_row()
        cells = row.cells
        for i in range(5):
            cells[i].width = col_widths[i]
            set_cell_margins(cells[i], 80, 80, 90, 90)

        row_bg = "FFFFFF" if idx % 2 == 0 else "F8FAFC"
        for i in range(5):
            set_cell_background(cells[i], row_bg)

        # Col 0: Module
        p0 = cells[0].paragraphs[0]
        r0 = p0.add_run(mod)
        r0.font.name = "Calibri"
        r0.font.size = Pt(9)
        r0.font.bold = True
        r0.font.color.rgb = RGBColor(15, 23, 42)

        # Col 1: Formula
        p1 = cells[1].paragraphs[0]
        r1 = p1.add_run(formula)
        r1.font.name = "Calibri"
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = RGBColor(30, 41, 59)

        # Col 2: Thresholds
        p2 = cells[2].paragraphs[0]
        r2 = p2.add_run(thresh)
        r2.font.name = "Calibri"
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = RGBColor(14, 116, 144) # Cyan/Blue accent

        # Col 3: State Machine & Logic
        p3 = cells[3].paragraphs[0]
        r3 = p3.add_run(logic)
        r3.font.name = "Calibri"
        r3.font.size = Pt(8.5)
        r3.font.color.rgb = RGBColor(51, 65, 85)

        # Col 4: Fail-Safe & UX
        p4 = cells[4].paragraphs[0]
        r4 = p4.add_run(ux)
        r4.font.name = "Calibri"
        r4.font.size = Pt(8.5)
        r4.font.color.rgb = RGBColor(71, 85, 105)

    # Save Document
    doc.save(output_path)
    print(f"Successfully generated specifications and logic matrix at: {output_path}")

if __name__ == "__main__":
    desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
    doc_file = os.path.join(desktop_path, "Axona_Fleet_Specifications_And_Logic_Matrix.docx")
    create_specifications_document(doc_file)
