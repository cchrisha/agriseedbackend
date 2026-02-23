import dbConnect from "../../lib/db.js";
import SeedStock from "../../models/SeedStock.js";
import Seed from "../../models/Seed.js";
import path from "path";
import PDFDocument from "pdfkit";

export default async function handler(req, res) {

  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  try {

    await dbConnect();

    const { process } = req.query;

    let filter = {};

    if (process && process !== "ALL") {
      filter.status = process;
    }

    const stocks = await SeedStock.find(filter)
      .sort({ createdAt: -1 })
      .populate("seed");

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=seed-history-${process || "ALL"}.pdf`
    );

    doc.pipe(res);

    // ================= WATERMARK =================
    try {
      const watermarkPath = path.resolve("./public/da.png");

      doc.save();
      doc.opacity(0.08);
      doc.image(
        watermarkPath,
        (doc.page.width - 350) / 2,
        (doc.page.height - 350) / 2,
        { width: 350 }
      );
      doc.restore();

    } catch (e) {
      console.log("Watermark not loaded");
    }

    // // ================= LOGO (UPPER RIGHT) =================
    // try {
    //   const logoPath = path.resolve("./public/da.png");
    //   doc.image(logoPath, doc.page.width - 130, 40, { width: 80 });
    // } catch (e) {
    //   console.log("Logo not found");
    // }

    // ================= HEADER =================

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

    let y = doc.y;

    const col1 = 50;
    const col2 = 90;
    const col3 = 330;
    const col4 = 410;
    const col5 = 460;

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
      doc.text(s.status || "-", col3, y);
      doc.text(String(s.block ?? "-"), col4, y);
      doc.text(String(s.lot ?? "-"), col5, y);

      y += 20;
    });

    // ================= FOOTER =================

    doc.moveDown(2);
    doc.font("Helvetica-Bold");
    doc.text(`Total Records: ${stocks.length}`, { align: "right" });

    doc.end();

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}