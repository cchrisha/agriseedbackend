import dbConnect from "../../lib/db.js";
import SeedStock from "../../models/SeedStock.js";
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

// ===================== TABLE HEADER =====================

doc.font("Helvetica-Bold").fontSize(10);

doc.text("#", 50);
doc.text("Serial Number", 70);
doc.text("Status", 300);
doc.text("Block", 380);
doc.text("Lot", 430);

doc.moveDown(0.5);
doc.font("Helvetica");

// ===================== TABLE DATA =====================

let y = doc.y;

stocks.forEach((s, i) => {

  doc.text(i + 1, 50, y);
  doc.text(s.tag || "-", 70, y);
  doc.text(s.status || "-", 300, y);
  doc.text(s.block ?? "-", 380, y);
  doc.text(s.lot ?? "-", 430, y);

  y += 20;

  if (y > 750) {
    doc.addPage();
    y = 50;
  }
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