import dbConnect from "../../lib/db.js";
import SeedStock from "../../models/SeedStock.js";
import path from "path";
import Seed from "../../models/Seed.js";
import PDFDocument from "pdfkit";

export default async function handler(req, res) {

  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  try {

    await dbConnect();

    const { process } = req.query;

    let filter = {};

    // FILTER BY STATUS (if provided)
    if (process && process !== "ALL") {
      filter.status = process;
    }

    const stocks = await SeedStock.find(filter)
      .sort({ createdAt: -1 })
      .populate("seed");

    //CREATE PDF

    const doc = new PDFDocument({ margin: 50 });

res.setHeader("Content-Type", "application/pdf");
res.setHeader(
  "Content-Disposition",
  `attachment; filename=seed-history-${process || "ALL"}.pdf`
);

doc.pipe(res);

// ===================== LOGO =====================

try {
  const logoPath = path.resolve("./public/da.png");
  doc.image(logoPath, {
    fit: [80, 80],
    align: "right"
  });
} catch (e) {
  console.log("Logo not found");
}

// ===================== HEADER =====================

doc
  .font("Helvetica-Bold")
  .fontSize(16)
  .text("DEPARTMENT OF AGRICULTURE", { align: "center" });

doc
  .fontSize(14)
  .text("PREC STA. BARBARA", { align: "center" });

doc.moveDown(1);

doc
  .fontSize(14)
  .text("Seed History Report", { align: "center" });

doc.moveDown(0.5);

doc
  .font("Helvetica")
  .fontSize(10)
  .text(`Process: ${process || "ALL"}`, { align: "center" });

doc.text(
  `Generated: ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}`,
  { align: "center" }
);

doc.moveDown(2);

// ================= TABLE HEADER =================

const startX = 50;
let y = doc.y;

const col1 = 50;   // #
const col2 = 80;   // Serial
const col3 = 320;  // Status
const col4 = 390;  // Block
const col5 = 440;  // Lot

doc.font("Helvetica-Bold");

doc.text("#", col1, y);
doc.text("Serial Number", col2, y);
doc.text("Status", col3, y);
doc.text("Block", col4, y);
doc.text("Lot", col5, y);

y += 20;

doc.font("Helvetica");

// ================= TABLE DATA =================

stocks.forEach((s, i) => {

  if (y > 750) {
    doc.addPage();
    y = 50;
  }

  doc.text(String(i + 1), col1, y);
  doc.text(s.tag || "-", col2, y, { width: 220 });
  doc.text(s.status || "-", col3, y, { width: 60 });
  doc.text(String(s.block ?? "-"), col4, y);
  doc.text(String(s.lot ?? "-"), col5, y);

  y += 20;
});

// ===================== FOOTER =====================

doc.moveDown(2);
doc.font("Helvetica-Bold");
doc.text(`Total Records: ${stocks.length}`, { align: "right" });

doc.end();

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}