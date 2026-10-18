import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    """Sets the background color of a table cell."""
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Sets padding/margins inside a table cell (in dxa: 20 dxa = 1 pt)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def add_callout(doc, text, title="IMPORTANT NOTICE", border_color="2563EB", bg_color="F0F4F8"):
    """Adds a stylish callout box with a colored left border and soft background."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=160)
    
    # Left border only
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    cell._tc.get_or_add_tcPr().append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run_t = p.add_run(f"[{title}] ")
    run_t.bold = True
    run_t.font.name = "Calibri"
    run_t.font.size = Pt(10)
    run_t.font.color.rgb = RGBColor(30, 58, 138)
    
    run_b = p.add_run(text)
    run_b.font.name = "Calibri"
    run_b.font.size = Pt(9.5)
    run_b.font.color.rgb = RGBColor(55, 65, 81)

def style_table_header(row, col_widths, bg_color="1E3A8A"):
    for idx, cell in enumerate(row.cells):
        cell.width = Inches(col_widths[idx])
        set_cell_background(cell, bg_color)
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        for p in cell.paragraphs:
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            for r in p.runs:
                r.bold = True
                r.font.name = "Calibri"
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(255, 255, 255)

def style_table_rows(tbl, col_widths, zebra=True):
    for r_idx, row in enumerate(tbl.rows[1:]):
        bg = "F9FAFB" if (zebra and r_idx % 2 == 1) else "FFFFFF"
        for c_idx, cell in enumerate(row.cells):
            cell.width = Inches(col_widths[c_idx])
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            for p in cell.paragraphs:
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(2)
                for r in p.runs:
                    r.font.name = "Calibri"
                    r.font.size = Pt(9)
                    r.font.color.rgb = RGBColor(31, 41, 55)

def create_document():
    doc = Document()
    
    # Page setup - standard Letter, 0.75 in margins for maximum content readability
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        
        # Header & Footer
        footer = section.footer
        f_p = footer.paragraphs[0]
        f_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        f_run = f_p.add_run("DMOC — Decision Marketing Operating System | Platform Report & Operating Manual")
        f_run.font.name = "Calibri"
        f_run.font.size = Pt(8.5)
        f_run.font.color.rgb = RGBColor(156, 163, 175)

    # Styles Setup
    styles = doc.styles
    normal_style = styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(31, 41, 55)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(5)

    def add_h1(text, space_before=14):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Calibri"
        run.font.size = Pt(17)
        run.font.color.rgb = RGBColor(30, 58, 138)
        return p

    def add_h2(text, space_before=10):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Calibri"
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(37, 99, 235)
        return p

    def add_h3(text, space_before=8):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Calibri"
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(17, 24, 39)
        return p

    def add_p(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(5)
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(31, 41, 55)
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(3)
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.name = "Calibri"
            r_pre.font.size = Pt(9.5)
            r_pre.font.color.rgb = RGBColor(17, 24, 39)
        r_text = p.add_run(text)
        r_text.font.name = "Calibri"
        r_text.font.size = Pt(9.5)
        r_text.font.color.rgb = RGBColor(31, 41, 55)
        return p

    def add_equation_box(latex_math, explanation=""):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
        
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'<w:left w:val="single" w:sz="18" w:space="0" w:color="0284C7"/>'
            f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'<w:right w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'</w:tcBorders>'
        )
        cell._tc.get_or_add_tcPr().append(borders)
        
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        r_eq = p.add_run(latex_math)
        r_eq.bold = True
        r_eq.font.name = "Cambria Math"
        r_eq.font.size = Pt(11)
        r_eq.font.color.rgb = RGBColor(15, 23, 42)
        
        if explanation:
            p2 = cell.add_paragraph()
            p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p2.paragraph_format.space_before = Pt(2)
            p2.paragraph_format.space_after = Pt(2)
            r_ex = p2.add_run(explanation)
            r_ex.font.italic = True
            r_ex.font.name = "Calibri"
            r_ex.font.size = Pt(9)
            r_ex.font.color.rgb = RGBColor(100, 116, 139)

    # ==========================================
    # PAGE 1: TITLE & EXECUTIVE SUMMARY
    # ==========================================
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(18)
    p_title.paragraph_format.space_after = Pt(2)
    r_main = p_title.add_run("DMOC: Comprehensive Platform Report & Complete Operating Manual")
    r_main.bold = True
    r_main.font.size = Pt(22)
    r_main.font.color.rgb = RGBColor(30, 58, 138)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(2)
    p_sub.paragraph_format.space_after = Pt(14)
    r_sub = p_sub.add_run("Decision Marketing Operating System • Enterprise Multi-Store Modeling, Inventory Analytics & Visual Workflow Engine")
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = RGBColor(79, 70, 229)

    # Document Meta Table
    meta_tbl = doc.add_table(rows=5, cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_widths = [2.2, 4.3]
    meta_data = [
        ("Document Version", "3.0.0 (Comprehensive Technical & Operational Standard)"),
        ("Official Classification", "Full System Architecture, Mathematical Foundations & User Manual"),
        ("Platform Status", "Active, Validated, Production-Ready"),
        ("Target Audience", "Store Owners, Analysts, Decision Scientists, Enterprise Retailers, Engineers"),
        ("Repository URL", "https://github.com/hardik33217/DMOC.git (Branch: main)"),
    ]
    for idx, (label, val) in enumerate(meta_data):
        row = meta_tbl.rows[idx]
        cell_l, cell_r = row.cells[0], row.cells[1]
        cell_l.width = Inches(meta_widths[0])
        cell_r.width = Inches(meta_widths[1])
        set_cell_background(cell_l, "F1F5F9")
        set_cell_background(cell_r, "FFFFFF")
        set_cell_margins(cell_l, top=70, bottom=70, left=100, right=100)
        set_cell_margins(cell_r, top=70, bottom=70, left=100, right=100)
        
        p_l = cell_l.paragraphs[0]
        p_l.paragraph_format.space_after = Pt(1)
        r_l = p_l.add_run(label)
        r_l.bold = True
        r_l.font.size = Pt(9)
        r_l.font.color.rgb = RGBColor(30, 41, 59)
        
        p_r = cell_r.paragraphs[0]
        p_r.paragraph_format.space_after = Pt(1)
        r_r = p_r.add_run(val)
        r_r.font.size = Pt(9)
        r_r.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_h1("1. Executive Summary & Core Mission", space_before=10)
    add_h2("1.1 The Operational Crisis in Retail & Store Decision-Making")
    add_p(
        "Modern enterprise retail, pharmacy management, grocery commerce, and quick-delivery logistics operate under tight margins, fluctuating lead times, and intense demand volatility. Store owners and procurement officers face three critical challenges:"
    )
    add_bullet(
        "Store managers routinely reorder stock based on recent customer memory or subjective hunches rather than empirical sales velocity, lead-time variance, and holding carrying costs. This leads to severe stockouts during peak surges or massive cash lockup in dead inventory.",
        bold_prefix="1. Intuition-Driven Procurement Errors: "
    )
    add_bullet(
        "Standard accounting software itemizes gross margins on individual product sales but fails to incorporate daily store operating overhead (rent, electricity, refrigeration, staff wages, insurance) during order evaluation. Procurement that appears profitable on paper frequently generates net cash losses.",
        bold_prefix="2. Gross vs. Net Profit Confusion: "
    )
    add_bullet(
        "Store teams rely on fragile, disconnected spreadsheets that lack live catalog data, cannot model stochastic risks, ignore regulatory restrictions (such as Indian NPPA DPCO drug price ceilings or Schedule H prescription mandates), and cannot be shared securely across store branches.",
        bold_prefix="3. Disconnected & Static Spreadsheets: "
    )

    add_h2("1.2 The Mission & Architectural Mandate of DMOC")
    add_p(
        "DMOC (Decision Marketing Operating System) unites rigorous decision science, real-world catalog and regulatory APIs, inventory mechanics, and reactive visual workflows into a unified platform. DMOC's primary objectives are:"
    )
    add_bullet(
        "Provides store managers and enterprise analysts with Multi-Criteria Decision Analysis (MCDA), Expected Monetary Value (EMV), Expected Utility Theory, and 10,000-run Monte Carlo stochastic simulations.",
        bold_prefix="• Democratize Decision Science: "
    )
    add_bullet(
        "Connects directly with Open Food Facts for grocery and FMCG barcode validation, and official NPPA / CDSCO registries for pharmaceutical maximum price ceilings and prescription compliance.",
        bold_prefix="• Real-World Catalog & Regulatory Ingestion: "
    )
    add_bullet(
        "Allows non-technical operators to build non-linear computational flow graphs with 26 modular nodes, conditional if/else branching, and real-time execution tracing.",
        bold_prefix="• Visual Node-Based Decision Canvas: "
    )
    add_bullet(
        "Provides plain-language reasoning chains, interactive 3D spatial trees, break-even unit calculations, and printable executive briefs.",
        bold_prefix="• Transparent & Auditable Intelligence: "
    )

    add_callout(
        doc,
        "DMOC strictly distinguishes Gross Profit from Net Profit. Operating costs (store rent, electricity, wages, and logistics) are never assumed to be zero in any procurement or replenishment evaluation.",
        title="CORE PHILOSOPHICAL COMMITMENT"
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 2: THEORETICAL FOUNDATIONS & DECISION SCIENCE
    # ==========================================
    add_h1("2. Theoretical Foundations & Mathematical Decision Science")
    add_p(
        "DMOC is built upon established, peer-reviewed mathematical methodologies implemented in the core calculation engine (decisionEngine.ts). Every calculation is auditable, deterministic where required, and statistically robust."
    )

    add_h2("2.1 Multi-Criteria Decision Analysis (MCDA)")
    add_p(
        "Multi-Criteria Decision Analysis evaluates competing options across multiple orthogonal criteria, each assigned a relative percentage weight w_j such that the sum of all weights equals 100%:"
    )
    add_equation_box("∑ (from j=1 to m) w_j = 100%,  where w_j > 0", "Weight Normalization Constraint")

    add_h3("Linear Normalization")
    add_p(
        "Criteria can represent either maximization (e.g., net revenue, shelf velocity, supplier reliability) or minimization (e.g., wholesale unit cost, return rate, working capital risk). DMOC maps disparate physical and financial units into dimensionless normalized utility values r_ij in [0, 1]:"
    )
    add_equation_box(
        "Maximization:  r_ij = (x_ij - x_j^min) / (x_j^max - x_j^min)\n"
        "Minimization:   r_ij = (x_j^max - x_ij) / (x_j^max - x_j^min)",
        "Linear Utility Transformation (Handles zero-variance edge cases by assigning r_ij = 1.0)"
    )

    add_h3("Weighted Sum Model (WSM)")
    add_p("The composite performance score S_i for each competing alternative i is calculated as:")
    add_equation_box("S_i = ∑ (from j=1 to m) w_j · r_ij", "Aggregate Weighted Performance Score")

    add_h2("2.2 Expected Monetary Value (EMV)")
    add_p(
        "Under conditions of risk and discrete uncertainty, each alternative i produces a set of mutually exclusive potential outcomes O_ik, each associated with an empirical probability P(O_ik) and monetary payoff X_ik:"
    )
    add_equation_box("EMV_i = ∑ (from k=1 to K) P(O_ik) · X_ik,  where ∑ P(O_ik) = 1.0", "Expected Monetary Value Formula")
    add_p(
        "DMOC computes the EMV spread across all alternatives to determine optimal risk-adjusted capital allocations, factoring in both optimistic upside and catastrophic loss scenarios."
    )

    add_h2("2.3 Expected Utility Theory (von Neumann–Morgenstern)")
    add_p(
        "In retail and inventory procurement, monetary value does not scale linearly with psychological satisfaction due to asymmetric downside risk aversion. A loss of $10,000 can cause bankruptcy, whereas a gain of $10,000 provides modest growth. DMOC maps monetary payoffs or qualitative outcomes to utility values U(O_ik) in [0, 100]:"
    )
    add_equation_box("EU_i = ∑ (from k=1 to K) P(O_ik) · U(O_ik)", "Risk-Averse Expected Utility")

    add_h2("2.4 Monte Carlo Stochastic Risk Simulation")
    add_p(
        "Real-world sales demand and supplier delivery windows are stochastic rather than fixed. DMOC executes a high-speed pseudo-random Monte Carlo engine running up to 10,000 iterations per scenario:"
    )
    add_bullet("Draws random values across parameterized normal, uniform, or triangular distributions representing customer footfall and supplier fulfillment delays.", bold_prefix="1. Probability Distribution Sampling: ")
    add_bullet("Computes empirical percentiles including P10 (Pessimistic Downside with 90% confidence), P50 (Median Baseline), and P90 (Optimistic High-Demand Ceiling).", bold_prefix="2. Empirical Percentile Estimation: ")
    add_bullet("Calculates mean expected return μ, variance σ^2, standard deviation σ, and value-at-risk (VaR).", bold_prefix="3. Statistical Moments: ")

    add_h2("2.5 Sensitivity Analysis & Tipping Points")
    add_p(
        "DMOC systematically perturbs individual criterion weights w_j from 0% to 100% while proportionately scaling remaining weights. It detects tipping points—the exact numerical weight threshold where the leading business recommendation flips to a competing alternative."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 3: FINANCIAL & INVENTORY MECHANICS
    # ==========================================
    add_h1("3. Financial & Inventory Mechanics")
    add_p(
        "Store decisions must reflect financial reality. DMOC executes strict mathematical accounting across every inventory restock, pricing adjustment, and supplier order."
    )

    add_h2("3.1 Gross Profit vs. Net Profit Breakdown")
    add_p(
        "Traditional retail tools mislead store owners by displaying high gross margins while ignoring fixed store overhead. DMOC requires and calculates both:"
    )
    add_equation_box(
        "Gross Revenue = Units Sold × Selling Price\n"
        "Cost of Goods Sold (COGS) = Units Sold × Purchase Price\n"
        "Gross Profit = Gross Revenue - COGS\n"
        "Gross Margin % = (Gross Profit / Gross Revenue) × 100",
        "Gross Profit Formulations"
    )
    add_p(
        "To calculate true Net Profit, DMOC apportions the store's verified monthly operating overhead (rent, electricity, refrigeration, staff wages, insurance) proportionally across operational working days and sales volume:"
    )
    add_equation_box(
        "Daily Operating Overhead = Monthly Operating Expenses / 30\n"
        "Allocated Overhead = Daily Operating Overhead × Holding Window (Days)\n"
        "Net Profit = Gross Profit - Allocated Overhead - Holding/Financing Costs\n"
        "Net Margin % = (Net Profit / Gross Revenue) × 100",
        "Net Bottom-Line Margin Formulations"
    )

    add_h2("3.2 Inventory Reorder Point (ROP) & Safety Stock")
    add_p(
        "To prevent catastrophic stockouts during demand surges without tying up excess cash, DMOC utilizes dynamic safety stock and lead-time demand calculations:"
    )
    add_equation_box(
        "Daily Sales Velocity (V_d) = (∑ Units Sold in Past N Days) / N\n"
        "Lead Time Demand = V_d × Supplier Lead Time (Days)\n"
        "Safety Stock = Z × σ_lead × √(Supplier Lead Time)\n"
        "Reorder Point (ROP) = Lead Time Demand + Safety Stock",
        "Dynamic Reorder Point & Safety Stock Formulations (Z = 1.65 for 95% service level)"
    )
    add_p(
        "When physical stock on hand drops below ROP, DMOC automatically flags the item with low-stock warnings and drafts an optimized procurement order."
    )

    add_h2("3.3 Working Capital Risk & Break-Even Quantity")
    add_p(
        "Every purchase order commits working capital that cannot be deployed elsewhere. DMOC calculates the break-even volume and capital commitment horizon:"
    )
    add_equation_box(
        "Capital Committed = Proposed Order Quantity × Unit Wholesale Cost\n"
        "Contribution Margin per Unit = Unit Selling Price - Unit Purchase Cost\n"
        "Break-Even Units = ⌈ Allocated Overhead / Contribution Margin per Unit ⌉\n"
        "Days of Inventory Remaining = Current Stock on Hand / V_d",
        "Working Capital & Break-Even Formulations"
    )

    # Comparison Table: Gross vs Net Impact
    add_h3("Illustrative Financial Case: 50 Units Restock Order")
    fin_tbl = doc.add_table(rows=6, cols=3)
    fin_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    fin_widths = [2.2, 2.1, 2.2]
    fin_headers = ["Financial Metric", "Standard Retail Tool", "DMOC Evidence Engine"]
    for i, h in enumerate(fin_headers):
        fin_tbl.rows[0].cells[i].paragraphs[0].text = h
    style_table_header(fin_tbl.rows[0], fin_widths, "1E3A8A")

    fin_rows = [
        ("Wholesale Cost (50 × $20)", "$1,000.00", "$1,000.00"),
        ("Gross Revenue (50 × $30)", "$1,500.00", "$1,500.00"),
        ("Gross Profit", "$500.00 (33.3% Margin)", "$500.00 (33.3% Margin)"),
        ("Allocated Overhead (Rent/Power)", "$0.00 (Ignored)", "$280.00 (Factored over 14 days)"),
        ("True Net Profit", "$500.00 (Misleading)", "$220.00 (14.7% Real Bottom Line)"),
    ]
    for r_idx, row_data in enumerate(fin_rows):
        row = fin_tbl.rows[r_idx + 1]
        for c_idx, val in enumerate(row_data):
            row.cells[c_idx].paragraphs[0].text = val
    style_table_rows(fin_tbl, fin_widths)

    doc.add_page_break()

    # ==========================================
    # PAGE 4: SYSTEM ARCHITECTURE & MONOREPO DESIGN
    # ==========================================
    add_h1("4. System Architecture & Technology Stack")
    add_p(
        "DMOC employs a modular, high-performance TypeScript monorepo architecture with clean separation of concerns across presentation, state, computation, and data persistence."
    )

    add_h2("4.1 Monorepo Structural Breakdown")
    add_bullet("React 18, Vite, Tailwind CSS, @xyflow/react v12, Three.js 3D Decision Tree, Zustand state store, and responsive glassmorphism UI.", bold_prefix="• frontend/: ")
    add_bullet("Node.js 20, Express, Prisma ORM, SQLite (local development) / PostgreSQL (production cloud), Argon2id encryption, and calculation microservices.", bold_prefix="• backend/: ")
    add_bullet("Shared TypeScript interfaces, Zod request/response validation schemas, and common mathematical type definitions.", bold_prefix="• shared/: ")

    add_h2("4.2 Technology Stack Matrix")
    tech_tbl = doc.add_table(rows=11, cols=4)
    tech_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tech_widths = [1.5, 1.6, 1.0, 2.4]
    headers = ["Layer / Subsystem", "Technology", "Version", "Architectural Role & Purpose"]
    for i, h in enumerate(headers):
        tech_tbl.rows[0].cells[i].paragraphs[0].text = h
    style_table_header(tech_tbl.rows[0], tech_widths, "1E3A8A")

    tech_rows = [
        ("Frontend Core", "React + TypeScript", "18.3.1", "Modular component hierarchy with strict compile-time types"),
        ("Build Tooling", "Vite", "5.4.21", "Sub-second HMR and production bundle minification"),
        ("Workflow Canvas", "@xyflow/react", "12.3.6", "Visual node editor, custom handles, smooth bezier paths"),
        ("3D Visualization", "Three.js + R3F", "0.160.0", "3D hierarchical decision trees with orbital controls"),
        ("State Management", "Zustand + Immer", "5.0.3", "Reactive state, undo/redo stacks, persistent storage"),
        ("Styling & Tokens", "Tailwind CSS", "3.4.1", "Curated HSL dark/light modes and Outfit typography"),
        ("Backend Runtime", "Node.js + Express", "20.x / 4.19", "High-throughput asynchronous REST microservices"),
        ("ORM & Schema", "Prisma ORM", "5.10.2", "Type-safe database migrations and relation mapping"),
        ("Database Engine", "SQLite / PostgreSQL", "3.x / 15+", "Zero-config local storage & high-concurrency cloud DB"),
        ("Security Core", "Argon2id + JWT", "0.40 / 9.0", "Memory-hard password hashing & dual-token rotation"),
    ]
    for r_idx, row_data in enumerate(tech_rows):
        row = tech_tbl.rows[r_idx + 1]
        for c_idx, val in enumerate(row_data):
            row.cells[c_idx].paragraphs[0].text = val
    style_table_rows(tech_tbl, tech_widths)

    add_h2("4.3 Architectural Execution Pipeline")
    add_p(
        "1. Ingestion: Client queries are parsed by the Natural Language Processor, extracting business context, product entities, proposed volumes, and time horizons.\n"
        "2. Enrichment: The backend checks local store inventory. If unlisted or needing verification, it queries Open Food Facts or CDSCO registries.\n"
        "3. Multi-Path Simulation: The Inventory Decision Engine models Path A (Proposed), Path B (Status Quo), and Path C (Calibrated Optimal).\n"
        "4. Visual Graph Compilation: The simulation payload is automatically compiled into an editable directed acyclic graph (DAG) on the workflow canvas.\n"
        "5. Execution & Audit: Running the workflow evaluates topological dependencies, recording execution times and node outputs into an immutable audit ledger."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 5: DATA ARCHITECTURE & SCHEMA REFERENCE
    # ==========================================
    add_h1("5. Data Architecture & Schema Reference")
    add_p(
        "DMOC models real-world store operations and decision science using an enterprise Prisma schema supporting multi-tenant workspace isolation and transactional integrity."
    )

    add_h2("5.1 Multi-Store Business & Catalog Models")
    add_bullet("Represents a distinct store, shop, or enterprise workspace. Contains monthly revenue, fixed operating costs, currency code (INR, USD, EUR), tax percentage, and the critical isSample boolean flag.", bold_prefix="1. Business Profile: ")
    add_bullet("Itemizes physical stock, SKU/barcode, category (Medicine, FMCG, Grocery), purchase cost, selling price, reorder threshold, shelf life in days, prescription requirements (Schedule H/H1), and legal price ceiling (DPCO MRP).", bold_prefix="2. Product Catalog: ")
    add_bullet("Tracks wholesale vendors, contact records, payment terms (Net 30, COD), lead time in days, minimum order quantity (MOQ), and reliability scoring.", bold_prefix="3. Supplier Ledger: ")
    add_bullet("Append-only audit trail capturing every inventory increment, customer sale, stock write-off, or return, ensuring tamper-proof stock reconciliations.", bold_prefix="4. Stock Movements: ")
    add_bullet("Records timestamped sales transactions with unit price, discount, tax, and calculated net profit contribution.", bold_prefix="5. Sales Ledger: ")

    add_h2("5.2 Decision & Workflow Graph Models")
    add_bullet("Stores the strategic decision inquiry, category (business, retail, pharmacy, financial), description, status, and deadline.", bold_prefix="1. Decision: ")
    add_bullet("Competing choices being evaluated (e.g., 'Order 50 Packs', 'Wait 1 Week', 'Order 25 Packs').", bold_prefix="2. Alternative: ")
    add_bullet("Evaluation dimensions (e.g., 'Net Profit Margin', 'Stockout Risk', 'Holding Cost') with maximization/minimization directions and priority weights.", bold_prefix="3. Criterion: ")
    add_bullet("Quantifiable consequences attached to alternatives with probability, monetary payoff, and risk tier (low, medium, high, critical).", bold_prefix="4. Outcome: ")
    add_bullet("Defines visual flow graphs with versioning, auto-increment counters, and template references.", bold_prefix="5. Workflow: ")
    add_bullet("Individual blocks on the canvas with coordinates (positionX, positionY), node type (26 types), and serialized JSON configuration.", bold_prefix="6. WorkflowNode: ")
    add_bullet("Directed connections linking a sourceNodeId and sourceHandle to a targetNodeId and targetHandle.", bold_prefix="7. WorkflowEdge: ")
    add_bullet("Execution logs capturing run timestamp, overall status (running, completed, failed), and node-by-node execution duration in milliseconds.", bold_prefix="8. WorkflowRun: ")

    add_h2("5.3 Strict Separation of Sample Demo Data")
    add_callout(
        doc,
        "DMOC workspaces explicitly separate sample demonstration stores (such as 'Arogya Medical Store' and 'FreshMart Grocery') from real user businesses using the 'isSample: true' database flag. Sample data is clearly badged in the UI and can be deleted or reset with a single click without affecting real business ledgers.",
        title="DATA INTEGRITY & ISOLATION"
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 6: NATURAL LANGUAGE DECISION WIZARD & REAL DATA INGESTION
    # ==========================================
    add_h1("6. Natural Language Decision Wizard & Real Data Ingestion")
    add_p(
        "DMOC features an intelligent decision wizard (BusinessDecisionWizard.tsx) that allows non-technical store operators to submit business dilemmas in everyday plain English."
    )

    add_h2("6.1 The Natural Language Processing Pipeline")
    add_p(
        "When an operator types: 'I own a pharmacy store. Should I order 50 additional packs of Paracetamol 650mg before the weekend?'"
    )
    add_bullet("Detects that the user operates a medical store or pharmacy.", bold_prefix="• Step 1 (Context Detection): ")
    add_bullet("Extracts 'Paracetamol 650mg' as target product and '50 units' as requested replenishment.", bold_prefix="• Step 2 (Entity Extraction): ")
    add_bullet("Identifies 'weekend' as a 3-day high-demand sales velocity window.", bold_prefix="• Step 3 (Temporal Horizon): ")
    add_bullet("Scans active workspace inventory. If found, loads current stock and supplier terms; if missing, initiates real-world API lookup.", bold_prefix="• Step 4 (Catalog Correlation): ")

    add_h2("6.2 External Data Verification & Regulatory Compliance")
    add_p("To eliminate guessing, DMOC cross-references queries against official external APIs:")
    add_bullet("Real-time lookup across millions of grocery and FMCG products. Retrieves barcode data, brand verification, pack sizes, ingredients, and categories.", bold_prefix="1. Open Food Facts API: ")
    add_bullet("Verifies medicine prices against statutory National Pharmaceutical Pricing Authority (NPPA) DPCO ceiling price caps. Prevents store owners from configuring illegal selling prices exceeding legal maximums.", bold_prefix="2. NPPA Drug Price Ceilings: ")
    add_bullet("Automatically tags Schedule H and H1 prescription drugs, alerting store operators that audited medical prescription records are legally required.", bold_prefix="3. CDSCO Prescription Regulations: ")

    add_h2("6.3 The 3-Path Comparative Simulation Model")
    add_p("The simulation engine automatically synthesizes three complete financial pathways:")

    path_tbl = doc.add_table(rows=6, cols=4)
    path_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    path_widths = [1.8, 1.5, 1.5, 1.7]
    path_headers = ["Simulation Metric", "Path A: Proposed Order", "Path B: Status Quo", "Path C: Calibrated Optimal"]
    for i, h in enumerate(path_headers):
        path_tbl.rows[0].cells[i].paragraphs[0].text = h
    style_table_header(path_tbl.rows[0], path_widths, "1E3A8A")

    path_rows = [
        ("Procurement Quantity", "50 units (User's input)", "0 units (No purchase)", "28 units (Mathematically optimal)"),
        ("Capital Committed", "$1,000.00 cash outlay", "$0.00 cash outlay", "$560.00 minimized cash outlay"),
        ("Stockout Probability", "< 1% (Over-stocked)", "88% (Stockouts by Saturday)", "< 2% (Guaranteed availability)"),
        ("Net Financial Margin", "+$220.00 net return", "$0.00 ($380.00 lost margin)", "+$310.00 maximized net return"),
        ("Days of Inventory", "24 days of supply", "1.5 days remaining", "7 days (Exact weekend coverage)"),
    ]
    for r_idx, row_data in enumerate(path_rows):
        row = path_tbl.rows[r_idx + 1]
        for c_idx, val in enumerate(row_data):
            row.cells[c_idx].paragraphs[0].text = val
    style_table_rows(path_tbl, path_widths)

    add_p(
        "With one click on 'Convert to Visual Workflow', DMOC translates this 3-Path model into an editable decision graph on the visual canvas."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 7: VISUAL NODE-BASED DECISION WORKFLOW CANVAS
    # ==========================================
    add_h1("7. The Visual Node-Based Decision Workflow Canvas")
    add_p(
        "DMOC features a visual computational flow engine built on @xyflow/react. It allows users to wire complex, multi-variable logic using 26 modular nodes."
    )

    add_h2("7.1 Graph Execution & Topological Dependency Sorting")
    add_bullet("The engine executes a Depth-First Search (DFS) topological sort of the Directed Acyclic Graph (DAG) before running, ensuring that parent output handles are resolved before dependent child nodes execute.", bold_prefix="• Topological Dependency Sorting: ")
    add_bullet("Detects circular loops and notifies the user with clear node IDs, preventing infinite execution deadlocks.", bold_prefix="• Cycle Detection: ")
    add_bullet("When an if_else node evaluates to true, child nodes on the true handle execute; downstream nodes on the false branch are marked as skipped in the execution drawer.", bold_prefix="• Dynamic Branch Pruning: ")

    add_h2("7.2 Complete 26-Node Catalogue Across 7 Categories")
    node_tbl = doc.add_table(rows=27, cols=4)
    node_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    node_widths = [1.6, 1.4, 1.4, 2.1]
    node_headers = ["Node Type", "Category", "I/O Handles", "Primary Functionality"]
    for i, h in enumerate(node_headers):
        node_tbl.rows[0].cells[i].paragraphs[0].text = h
    style_table_header(node_tbl.rows[0], node_widths, "1E3A8A")

    catalog = [
        ("start_decision", "Triggers", "None -> default", "Pipeline entrypoint for automated decisions"),
        ("manual_trigger", "Triggers", "None -> default", "User-initiated execution button in canvas"),
        ("import_spreadsheet", "Triggers", "None -> data", "Parses tabular data directly from Excel (.xlsx)"),
        ("existing_decision", "Triggers", "None -> decision", "Loads a saved decision model from the database"),
        ("decision_question", "Inputs", "input -> question", "Formalizes the core strategic business question"),
        ("alternative", "Inputs", "input -> alternative", "Defines candidate options (Option A vs Option B)"),
        ("define_criteria", "Inputs", "input -> criteria", "Configures evaluation metrics and directions"),
        ("set_criteria_weights", "Inputs", "criteria -> weights", "Sliders assigning relative percentage weights"),
        ("define_constraints", "Inputs", "input -> constraints", "Hard boundaries (budget ceiling, regulatory caps)"),
        ("set_assumptions", "Inputs", "input -> assumptions", "Baseline conditions (inflation, currency rates)"),
        ("if_else", "Logic", "condition -> true, false", "Conditional branching via boolean expressions"),
        ("compare_values", "Logic", "left, right -> result", "Relational comparison (==, !=, >, <, >=, <=)"),
        ("threshold_check", "Logic", "value -> result", "Triggers warning alerts on critical limit breach"),
        ("and_or_conditions", "Logic", "conditions -> result", "Multi-gate logical boolean evaluations"),
        ("filter_alternatives", "Logic", "alternatives -> filtered", "Excludes options violating hard constraints"),
        ("merge_branches", "Logic", "branch1..3 -> merged", "Converges parallel flows into unified pipe"),
        ("possible_outcome", "Outcomes", "input -> outcome", "Attaches discrete consequences to options"),
        ("probability", "Outcomes", "input -> probability", "Explicit decimal likelihood between 0 and 1.0"),
        ("cost", "Outcomes", "input -> cost", "Models financial wholesale cost or penalty"),
        ("benefit", "Outcomes", "input -> benefit", "Projects revenue upside or utility score"),
        ("risk_assessment", "Outcomes", "input -> risk", "Qualitative risk tiering (low, med, high, crit)"),
        ("time_estimate", "Outcomes", "input -> time", "Duration for delivery, shelf life, lead time"),
        ("custom_metric", "Outcomes", "input -> metric", "Bespoke KPIs (Customer Loyalty, NPS)"),
        ("weighted_score", "Calculations", "criteria -> score", "Multi-Criteria Decision Analysis (MCDA)"),
        ("expected_monetary_value", "Calculations", "outcomes -> emv", "Probability-weighted EMV calculations"),
        ("monte_carlo", "Calculations", "distributions -> results", "10,000-run stochastic risk simulation"),
    ]
    for r_idx, row_data in enumerate(catalog):
        row = node_tbl.rows[r_idx + 1]
        for c_idx, val in enumerate(row_data):
            row.cells[c_idx].paragraphs[0].text = val
    style_table_rows(node_tbl, node_widths)

    doc.add_page_break()

    # ==========================================
    # PAGE 8: STORE OPERATIONS & DECISION SUITE
    # ==========================================
    add_h1("8. Store Operations & Decision Suite")
    add_p(
        "DMOC bridges high-level decision theory with everyday shopfloor operations, providing live inventory visibility, supplier terms, and spatial 3D visualization."
    )

    add_h2("8.1 Inventory & Catalog Operations")
    add_bullet("Tracks batches and shelf-life horizons. Perishable grocery and pharmaceutical items expiring within 30 days display prominent yellow warning badges; items expiring within 7 days trigger red markdown alerts.", bold_prefix="• Batch & Expiry Monitoring: ")
    add_bullet("Tracks real-time stock on hand against minimum reorder points. Highlights cash tied up in dead stock.", bold_prefix="• Stock Level Tracking: ")
    add_bullet("Complete ledger recording stock receipts, customer sales, supplier returns, and write-offs.", bold_prefix="• Stock Movement Audit: ")

    add_h2("8.2 Supplier Management & Terms")
    add_bullet("Records vendor name, contact person, phone, email, and catalog mappings.", bold_prefix="• Vendor Directory: ")
    add_bullet("Incorporates supplier lead times (in days) into dynamic reorder point calculations.", bold_prefix="• Lead-Time Tracking: ")
    add_bullet("Models payment terms (Net 30, Net 60, Cash on Delivery) to project cash outflow schedules.", bold_prefix="• Commercial Terms: ")
    add_bullet("Evaluates supplier minimum order quantities (MOQ) and volume discounts during restock evaluations.", bold_prefix="• MOQ & Volume Tiers: ")

    add_h2("8.3 Interactive 3D Decision Tree & 2D Fallback")
    add_p(
        "DMOC provides dual visualization interfaces for inspecting complex decision hierarchies:"
    )
    add_bullet("Constructed using Three.js and React Three Fiber. Visualizes the decision problem as a spatial node-and-link tree with orbital camera controls, mousewheel zooming, color-coded risk paths, and click-to-inspect modals.", bold_prefix="1. Interactive 3D Spatial Tree: ")
    add_bullet("Engineered in pure SVG for ultra-low latency on mobile devices or environments where WebGL is unavailable or disabled.", bold_prefix="2. Resilient 2D Canvas Fallback: ")

    add_callout(
        doc,
        "DMOC's 3D and 2D decision tree engines render the exact same underlying mathematical tree hierarchy. Switching between modes preserves selected node states and calculation outputs instantly.",
        title="VISUALIZATION RESILIENCE"
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 9: RESTFUL API ENDPOINT REFERENCE
    # ==========================================
    add_h1("9. Comprehensive RESTful API Reference")
    add_p(
        "All DMOC backend endpoints are versioned under /api and return structured JSON responses adhering to standardized success/error schemas."
    )

    api_tbl = doc.add_table(rows=18, cols=4)
    api_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    api_widths = [1.1, 2.2, 1.3, 1.9]
    api_headers = ["Method", "Endpoint Route", "Access Level", "Action / Data Returned"]
    for i, h in enumerate(api_headers):
        api_tbl.rows[0].cells[i].paragraphs[0].text = h
    style_table_header(api_tbl.rows[0], api_widths, "1E3A8A")

    endpoints = [
        ("POST", "/api/auth/register", "Public", "Register user account (Argon2id hashing)"),
        ("POST", "/api/auth/login", "Public", "Authenticates user; sets JWT cookie & token"),
        ("POST", "/api/auth/logout", "Authenticated", "Revokes session and clears secure cookie"),
        ("GET", "/api/businesses", "Authenticated", "Lists all workspaces belonging to user"),
        ("POST", "/api/businesses", "Authenticated", "Creates a new business workspace profile"),
        ("GET", "/api/businesses/:id/kpis", "Authenticated", "Calculates live revenue, net profit, stockouts"),
        ("GET", "/api/products", "Authenticated", "Lists store catalog with category/stock filters"),
        ("POST", "/api/products", "Authenticated", "Adds new SKU with pricing and shelf life"),
        ("GET", "/api/products/search-enrichment", "Authenticated", "Queries Open Food Facts & NPPA DPCO APIs"),
        ("POST", "/api/inventory/movements", "Authenticated", "Logs inventory receipt, write-off, or audit"),
        ("GET", "/api/suppliers", "Authenticated", "Lists suppliers, lead times, and payment terms"),
        ("POST", "/api/inventory-decisions/evaluate", "Authenticated", "Evaluates NLP restock inquiry (3-Path Model)"),
        ("POST", "/api/simulations/run", "Authenticated", "Runs 10,000-iteration Monte Carlo simulation"),
        ("GET", "/api/workflows", "Authenticated", "Retrieves all visual decision workflows"),
        ("POST", "/api/workflows", "Authenticated", "Creates a new decision flow graph"),
        ("POST", "/api/workflows/:id/run", "Authenticated", "Executes DAG workflow; returns node logs"),
        ("GET", "/api/import-export/template", "Authenticated", "Downloads standard dmoc-template.xlsx"),
    ]
    for r_idx, row_data in enumerate(endpoints):
        row = api_tbl.rows[r_idx + 1]
        for c_idx, val in enumerate(row_data):
            row.cells[c_idx].paragraphs[0].text = val
    style_table_rows(api_tbl, api_widths)

    add_h2("9.2 Security & Authentication Protocols")
    add_bullet("All passwords are salted and hashed using Argon2id with 64MB memory cost, 3 iterations, and 4 threads, providing high resistance against GPU and ASIC brute-force attacks.", bold_prefix="• Argon2id Password Encryption: ")
    add_bullet("Dual-token system using short-lived JWT access tokens (15-minute expiration) and cryptographically signed refresh tokens stored in secure, SameSite=Lax, HttpOnly cookies.", bold_prefix="• Dual-Token Rotation: ")
    add_bullet("Every workspace update, inventory write-off, and workflow run creates an append-only entry in the AuditEvent database table.", bold_prefix="• Immutable Audit Logging: ")

    doc.add_page_break()

    # ==========================================
    # PAGE 10: USER OPERATING MANUAL, DEPLOYMENT & FAQ
    # ==========================================
    add_h1("10. End-to-End User Operating Manual & Deployment")
    
    add_h2("10.1 Step-by-Step Walkthrough Guide")
    add_bullet("Visit the DMOC homepage and click 'Get Started'. Complete the 4-step onboarding modal: (1) Business Name & Type, (2) Currency & Tax Rate, (3) Monthly Turnover & Operating Costs, and (4) Optional Sample Data Seeding.", bold_prefix="Step 1: Onboarding Your Store: ")
    add_bullet("Use the Workspace Selector dropdown in the top sidebar to toggle between different store locations or demo profiles seamlessly.", bold_prefix="Step 2: Switching Store Workspaces: ")
    add_bullet("Navigate to the 'Decision Wizard'. Enter your dilemma in everyday language (e.g., 'Should I order 40 units of Almond Milk before Friday?'). Click 'Analyze Business Decision'.", bold_prefix="Step 3: Running Natural Language Decisions: ")
    add_bullet("Compare Path A (Full Order), Path B (Do Nothing), and Path C (Calibrated Optimal). Inspect capital committed, stockout probability, and true net profit.", bold_prefix="Step 4: Evaluating the 3-Path Model: ")
    add_bullet("Click 'Convert to Visual Workflow'. Drag additional logic nodes (e.g., 'If/Else' or 'Threshold Check') onto the canvas. Click 'Run Flow' to execute real-time DAG simulation.", bold_prefix="Step 5: Visual Workflow Customization: ")
    add_bullet("Visit the 'Reports' page to review the DMOC Executive Brief. Click 'Print / Save as PDF' for executive physical documentation, or download complete Excel data books from Settings.", bold_prefix="Step 6: Generating Executive Briefs & Reports: ")

    add_h2("10.2 Production Deployment (Docker Compose)")
    add_p(
        "Deploying DMOC in a production cloud environment requires Docker and Docker Compose. Run:"
    )
    add_equation_box(
        "git clone https://github.com/hardik33217/DMOC.git\n"
        "cd DMOC\n"
        "docker-compose up -d --build",
        "Unified Multi-Container Production Command"
    )

    add_h2("10.3 Frequently Asked Questions (FAQ)")
    add_bullet("Yes. DMOC functions fully on local SQLite or offline PostgreSQL. External API queries queue automatically until connectivity is restored.", bold_prefix="Q: Can DMOC operate without an active internet connection? ")
    add_bullet("Never. DMOC enforces strict tenant isolation. All business turnover, margins, and catalog records belong exclusively to your instance and are never shared.", bold_prefix="Q: Does DMOC monetize or share private sales figures? ")
    add_bullet("DMOC integrates seasonal velocity multipliers, lead-time variance buffers, and safety stock calculations to increase reorder points ahead of anticipated trading rushes.", bold_prefix="Q: How does DMOC prevent stockouts during sudden demand surges? ")

    # Closing Signature
    add_callout(
        doc,
        "DMOC: Decision Marketing Operating System\n"
        "Version 3.0.0 • Complete System Architectural Report & User Operating Manual\n"
        "Engineered by the DMOC Core Engineering & Decision Science Team • October 2026",
        title="DOCUMENT RATIFICATION",
        border_color="0D9488",
        bg_color="F0FDFA"
    )

    # Save output
    output_path = os.path.abspath("DMOC_Platform_Report_and_User_Manual.docx")
    doc.save(output_path)
    print(f"Successfully generated Word document at: {output_path}")

if __name__ == "__main__":
    create_document()
