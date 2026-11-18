import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, hex_color):
    tcPr = cell._element.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_alert_document(output_path):
    doc = docx.Document()

    # Set 0.7 inch margins for spacious tables
    for section in doc.sections:
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.7)
        section.right_margin = Inches(0.7)

    # Document Title
    p_title = doc.add_paragraph()
    r_title = p_title.add_run("AXONA FLEET MANAGEMENT — STATUTORY TELEMATICS SPECIFICATION")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(18)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42) # Slate Navy
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(2)

    p_sub = doc.add_paragraph()
    r_sub = p_sub.add_run("Comprehensive Alert Classification Matrix: Critical, Warning & Info Criteria, Thresholds, and Fleet Impact")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(11)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(71, 85, 105)
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(16)

    # Metadata Summary Box
    meta_table = doc.add_table(rows=2, cols=4)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_headers = [("Standard", "MoRTH AIS-140 / ARAI"), ("Architecture", "Axona Enterprise SaaS v2.4"), 
                    ("Total Alert Definitions", "24 Alert Classes"), ("Date Generated", "November 2026")]
    
    for i, (k, v) in enumerate(meta_headers):
        cell = meta_table.cell(i // 4, i % 4 if i < 4 else (i-4))
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        rk = p.add_run(f"{k}\n")
        rk.font.size = Pt(8.5)
        rk.font.bold = True
        rk.font.color.rgb = RGBColor(100, 116, 139)
        rv = p.add_run(v)
        rv.font.size = Pt(9.5)
        rv.font.bold = True
        rv.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Overview note
    p_note = doc.add_paragraph()
    r_note = p_note.add_run("Executive Overview: ")
    r_note.font.bold = True
    r_note.font.color.rgb = RGBColor(15, 23, 42)
    p_note.add_run(
        "This specification establishes the standardized criteria for all telemetry, behavioral, environmental, "
        "and compliance alerts generated across the Axona Fleet Platform. Each alert is categorized as CRITICAL, "
        "WARNING, or INFO based on the physical severity of threshold deviation, safety risk, and required dispatcher intervention."
    )
    p_note.paragraph_format.space_after = Pt(12)

    # Alert Data Rows
    # Fields: Category, Alert Name, Code, Severity, Physical Trigger Criteria & Threshold, Fleet & Operational Impact, System & App Action
    alerts = [
        # --- 1. AIS-140 Emergency SOS ---
        ("1. Critical Emergency", "AIS-140 Physical Panic SOS", "Code 01 ($ALT / $SOS)", "CRITICAL",
         "Driver or passenger activates hardware panic button mounted in cabin (Digital Input = 1).",
         "Imminent passenger/driver physical danger, hijacking attempt, armed robbery, or major medical crisis.",
         "Full-screen red modal popup with pulsing radar, continuous 800-960 Hz ambulance siren, emergency SMS dispatch, NOC console alert."),

        ("1. Critical Emergency", "Unattended SOS Escalation", "Code 02 (ESC)", "WARNING",
         "Emergency panic incident remains unacknowledged by fleet controller for > 15 minutes.",
         "Failure of NOC operational response; delayed emergency assistance.",
         "Escalation notification dispatched to senior fleet management and fleet safety head."),

        # --- 2. Driver Intelligence & Behavior (Comparison of Warning vs Critical) ---
        ("2. Driver Behavior", "Harsh Braking (Severe Panic Stop)", "Code 13 (HB-C)", "CRITICAL",
         "Rapid deceleration exceeding -0.70g (e.g. -0.74g sudden lockup at 62 km/h).",
         "Severe rear-end collision hazard, wheel lockup, cargo displacement/breakage, acute tire flat-spotting.",
         "Full-screen emergency popup, warning audio tone, immediate deduction from Fleet Safety Score, flagged in driver audit."),

        ("2. Driver Behavior", "Harsh Braking (Routine Deceleration)", "Code 13 (HB-W)", "WARNING",
         "Deceleration between -0.55g and -0.70g (Statutory HBT threshold = 0.55g).",
         "Aggressive driving behavior, premature brake pad wear, tailgating, passenger discomfort.",
         "Logged in Driver Intelligence ledger, yellow status pill on Alert Centre, 3-point deduction from driver score."),

        ("2. Driver Behavior", "Harsh Acceleration (Extreme Surge)", "Code 14 (HA-C)", "CRITICAL",
         "Rapid forward acceleration exceeding +0.55g to +0.60g (e.g. +0.61g rapid surge).",
         "Heavy commercial drivetrain shock, transmission shearing, cargo spill risk, loss of vehicle steerage.",
         "Full-screen modal popup, alert notification sound, critical event logged in driver ledger."),

        ("2. Driver Behavior", "Harsh Acceleration (Aggressive Pickup)", "Code 14 (HA-W)", "WARNING",
         "Forward acceleration between +0.43g and +0.55g (Statutory HAT threshold = 0.43g).",
         "Excessive fuel consumption (15-25% fuel loss), clutch/transmission wear, aggressive driving habit.",
         "Logged in Driver scorecard, amber card in Alert Centre, 2-point safety score penalty."),

        ("2. Driver Behavior", "Vehicle Tilt / Rollover Hazard", "Code 22 (TI)", "CRITICAL",
         "3-axis MEMS accelerometer measures roll/pitch angle exceeding 45.0° (e.g. 48.5° lean).",
         "Catastrophic vehicle rollover danger, fatal structural tipping on slopes, dangerous uneven cargo shift.",
         "Immediate full-screen red rollover popup with 1250-750 Hz chirp siren, urgent dispatcher intervention required."),

        ("2. Driver Behavior", "Rash Turning / Sharp Swerve", "Code 15 (RT)", "WARNING",
         "Cornering speed > 30 km/h with lateral acceleration >= 0.47g (e.g. 41 km/h at 0.50g).",
         "Centrifugal vehicle tipping risk, uneven sidewall tire scrub, potential load dislodgment.",
         "Logged in Driver Intelligence records, warning badge, driver behavior scorecard penalty."),

        ("2. Driver Behavior", "Overspeeding (Reckless High Speed)", "Code 17 (OS-C)", "CRITICAL",
         "Vehicle speed exceeds statutory speed limit by > 15-20 km/h (e.g. 86.4 km/h in 65 km/h zone).",
         "Fatal impact potential, exponentially multiplied braking distance, severe loss of steering control.",
         "Emergency popup with high-speed alarm, immediate driver infraction log, NOC overspeed audit."),

        ("2. Driver Behavior", "Overspeeding (Routine Exceedance)", "Code 17 (OS-W)", "WARNING",
         "Vehicle speed exceeds statutory speed limit by 1 to 15 km/h (e.g. 76 km/h in 65 km/h zone).",
         "Regulatory traffic violation, increased fuel consumption, automated e-challan radar penalty risk.",
         "Amber card in Alert Centre, speed event logged in 90-day compliance report."),

        # --- 3. Motion & Security ---
        ("3. Motion & Security", "Unauthorized Vehicle Towing", "Code 25 (TOW)", "CRITICAL",
         "Vehicle movement detected (Speed > 5 km/h, e.g. 18.5 km/h) while engine ignition is switched OFF.",
         "Vehicle theft in progress, predatory towing, or asset being hauled away without authorization.",
         "Full-screen high-priority modal with triple-pulse security alarm (680 Hz), 1-tap Live Map tracking."),

        ("3. Motion & Security", "Excessive Engine Idling", "Code 26 (IDL)", "WARNING",
         "Engine ignition running (IGN = 1) with vehicle stationary (Speed = 0 km/h) for > 15 minutes.",
         "Massive fuel wastage (up to 2-3 liters/hr), unnecessary carbon emissions, engine cylinder carbon buildup.",
         "Logged in Fleet Utilization metrics, fleet operational efficiency warning dispatched."),

        ("3. Motion & Security", "In-Motion Immobilisation Blocked", "Code 27 (SEC-B)", "CRITICAL",
         "Remote engine starter relay lockdown attempted while vehicle speed is > 0.0 km/h.",
         "Life safety risk averted (strict safety lockout prevents dangerous highway engine cutoffs).",
         "Server rejects relay command with safety audit exception; dispatches alert to supervisor."),

        ("3. Motion & Security", "Starter Relay Immobilised", "Code 28 (SEC-I)", "WARNING",
         "Authorized remote relay command executed while vehicle stationary (Speed = 0 km/h).",
         "Starter circuit grounded; vehicle prevented from starting during scheduled night lockdown or repossession.",
         "Security status updated on Live Tracking map; logged in permanent security audit trail."),

        ("3. Motion & Security", "Engine Ignition ON", "Code 29 (IGN-1)", "INFO",
         "Vehicle Digital Input 1 transitions from 0 (OFF) to 1 (ON).",
         "Normal start of trip / asset operational deployment.",
         "Logged in live telematics stream, trip start point recorded."),

        ("3. Motion & Security", "Engine Ignition OFF", "Code 30 (IGN-0)", "INFO",
         "Vehicle Digital Input 1 transitions from 1 (ON) to 0 (OFF).",
         "Trip conclusion, driver stopover, or delivery drop-off.",
         "Logged in trip history, stoppage time counter initiated."),

        # --- 4. Geofencing & Perimeter ---
        ("4. Geofencing", "Geofence Departure / Perimeter Breach", "Code 21 (GO)", "CRITICAL",
         "Vehicle exits designated authorized depot, warehouse, or logistics hub without clearance.",
         "Route deviation, cargo diversion, unauthorized trip, or vehicle theft.",
         "Full-screen modal popup with dual-tone chime (554-830 Hz), location address, 'View on Live Map' button."),

        ("4. Geofencing", "Restricted Municipal Zone Entry", "Code 20 (GI-R)", "CRITICAL",
         "Heavy commercial truck enters municipal inner ring during peak restricted hours (8 AM - 9 PM).",
         "Severe municipal police impoundment, massive RTO fine (Rs 10,000+), traffic congestion penalty.",
         "Full-screen modal popup with resonant chime, dispatcher alerted to re-route driver immediately."),

        ("4. Geofencing", "Authorized Hub Entry", "Code 20 (GI)", "INFO",
         "Vehicle crosses virtual perimeter entering scheduled company distribution yard or depot.",
         "Timely arrival confirmation, loading dock assignment readiness.",
         "Arrival logged in trip manifest, geofence dwell timer initialized."),

        ("4. Geofencing", "Geofence Zone Overspeed", "Code 24 (G-SPD)", "WARNING",
         "Vehicle exceeds custom localized speed limit inside geofence (e.g. > 20 km/h inside refinery bay).",
         "High collision risk in dense pedestrian/forklift area, safety protocol violation.",
         "Warning alert card in Alert Centre, supervisor notified of yard safety infraction."),

        # --- 5. Hardware Health & Device Tamper ---
        ("5. Hardware Health", "Main Battery Disconnect / Power Cut", "Code 08 (PWR-CUT)", "CRITICAL",
         "External 12V/24V vehicle power supply drops to 0V; device runs on internal backup battery.",
         "Intentional wire cutting by thieves or severe alternator/battery electrical failure.",
         "High-priority hardware alert card, internal battery countdown timer displayed in Device Health."),

        ("5. Hardware Health", "Enclosure Tamper Switch Triggered", "Code 09 (TAMPER)", "CRITICAL",
         "Physical micro-switch on AIS-140 device casing opened or ripped from dashboard.",
         "Physical sabotage, device tampering, attempt to bypass GPS tracking.",
         "Tamper event locked in permanent audit log, device status flagged as 'Tampered'."),

        ("5. Hardware Health", "Low Internal Backup Battery", "Code 10 (BAT-LOW)", "WARNING",
         "Internal Li-ion battery charge falls below 20% while external power is disconnected.",
         "Imminent complete tracking blackout within 60 minutes.",
         "Warning banner on Device Health screen, reminder to inspect vehicle wiring."),

        ("5. Hardware Health", "GPS Fix Lost / Antenna Cut", "Code 11 (GPS-LOST)", "WARNING",
         "GPS satellite lock falls below 4 satellites or external GNSS antenna disconnected.",
         "Loss of coordinate accuracy; fallback to cellular LBS cell-tower triangulation.",
         "Asset marked as 'Degraded Fix' on Live Map with warning pill."),

        ("5. Hardware Health", "Device Offline (No Ping)", "Code 12 (OFFLINE)", "WARNING",
         "No heartbeat packet received from device IMEI for > 10 minutes.",
         "GSM network blackout, SIM deactivation, or device power failure.",
         "Asset card updated to 'Offline GPS' across fleet dashboard."),

        # --- 6. Statutory VAHAN & Compliance ---
        ("6. Statutory VAHAN", "Pending Traffic e-Challan", "VAHAN-CHL", "WARNING",
         "Active unpaid traffic violation detected on MoRTH National e-Challan central portal.",
         "Financial liability (unpaid fine), compounding legal interest, refusal of FC renewal by RTO.",
         "Yellow pill in Compliance screen with Challan #, offense details, and direct payment link."),

        ("6. Statutory VAHAN", "Vehicle Blacklist Flag", "VAHAN-BLK", "CRITICAL",
         "Vehicle registration flagged on National Crime Records Bureau (NCRB) or VAHAN blacklist.",
         "Immediate police seizure, impoundment at highway toll plazas, invalid commercial operation.",
         "Critical banner on Compliance screen, immediate alert dispatched to fleet legal head."),

        ("6. Statutory VAHAN", "Insurance Policy Expired / Due", "VAHAN-INS", "CRITICAL",
         "Commercial vehicle insurance expired or within 15-day renewal grace period.",
         "Total uninsured liability in third-party accidents, statutory impoundment under MV Act.",
         "High-priority compliance alert card with renewal urgency countdown."),

        ("6. Statutory VAHAN", "Fitness Certificate (FC) Expired", "VAHAN-FIT", "CRITICAL",
         "Automated Vehicle Testing Station (ATS) validity date lapsed.",
         "Invalid registration, vehicle deemed unroadworthy, legal prohibition from public highways.",
         "Critical statutory flag on Compliance screen; asset prevented from trip assignment."),

        ("6. Statutory VAHAN", "Commercial DL Validity Expiry", "SARATHI-DL", "WARNING",
         "Assigned driver's commercial transport badge/licence validity expiring within 30 days.",
         "Unlicensed commercial transit risk, driver disqualification during RTO highway inspection.",
         "Alert displayed in Sarathi DL Verification dossier with days-remaining countdown.")
    ]

    # Create Primary Table
    # Columns: Category, Alert Name & Code, Severity, Trigger Criteria & Threshold, Fleet & Operational Impact, System & App Action
    table = doc.add_table(rows=1, cols=6)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    col_widths = [Inches(1.0), Inches(1.2), Inches(0.8), Inches(1.8), Inches(1.8), Inches(1.5)]
    headers = ["Category", "Alert Name & Code", "Severity", "Trigger Criteria & Threshold", "Fleet & Operational Impact", "System & App Action"]

    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "0F172A") # Navy
        set_cell_margins(hdr_cells[i], 120, 120, 100, 100)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(title)
        r.font.name = "Calibri"
        r.font.size = Pt(9.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    # Populate Data Rows
    for idx, (cat, name, code, sev, crit, impact, action) in enumerate(alerts):
        row = table.add_row()
        cells = row.cells
        for i in range(6):
            cells[i].width = col_widths[i]
            set_cell_margins(cells[i], 80, 80, 90, 90)

        # Alternating background
        row_bg = "FFFFFF" if idx % 2 == 0 else "F8FAFC"
        for i in range(6):
            set_cell_background(cells[i], row_bg)

        # Col 0: Category
        p0 = cells[0].paragraphs[0]
        r0 = p0.add_run(cat)
        r0.font.name = "Calibri"
        r0.font.size = Pt(8.5)
        r0.font.bold = True
        r0.font.color.rgb = RGBColor(51, 65, 85)

        # Col 1: Name & Code
        p1 = cells[1].paragraphs[0]
        r1a = p1.add_run(f"{name}\n")
        r1a.font.name = "Calibri"
        r1a.font.size = Pt(9)
        r1a.font.bold = True
        r1a.font.color.rgb = RGBColor(15, 23, 42)
        r1b = p1.add_run(code)
        r1b.font.name = "Courier New"
        r1b.font.size = Pt(8)
        r1b.font.color.rgb = RGBColor(2, 132, 199)

        # Col 2: Severity Badge
        p2 = cells[2].paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r2 = p2.add_run(sev)
        r2.font.name = "Calibri"
        r2.font.size = Pt(8.5)
        r2.font.bold = True
        if sev == "CRITICAL":
            r2.font.color.rgb = RGBColor(220, 38, 38) # Red
            set_cell_background(cells[2], "FEF2F2")
        elif sev == "WARNING":
            r2.font.color.rgb = RGBColor(217, 119, 6) # Amber
            set_cell_background(cells[2], "FFFBEB")
        else: # INFO
            r2.font.color.rgb = RGBColor(37, 99, 235) # Blue
            set_cell_background(cells[2], "EFF6FF")

        # Col 3: Criteria & Threshold
        p3 = cells[3].paragraphs[0]
        r3 = p3.add_run(crit)
        r3.font.name = "Calibri"
        r3.font.size = Pt(8.5)
        r3.font.color.rgb = RGBColor(30, 41, 59)

        # Col 4: Impact
        p4 = cells[4].paragraphs[0]
        r4 = p4.add_run(impact)
        r4.font.name = "Calibri"
        r4.font.size = Pt(8.5)
        r4.font.color.rgb = RGBColor(30, 41, 59)

        # Col 5: Action
        p5 = cells[5].paragraphs[0]
        r5 = p5.add_run(action)
        r5.font.name = "Calibri"
        r5.font.size = Pt(8.5)
        r5.font.color.rgb = RGBColor(71, 85, 105)

    # Save Document
    doc.save(output_path)
    print(f"Successfully generated alert specification matrix at: {output_path}")

if __name__ == "__main__":
    desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
    doc_file = os.path.join(desktop_path, "Axona_Fleet_Alerts_Specification_Matrix.docx")
    create_alert_document(doc_file)
