import dbConnect from "../../../lib/db.js";
import SeedStock from "../../../models/SeedStock.js";
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

    // CREATE PDF
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=seed-history-${process || "ALL"}.pdf`
    );

    doc.pipe(res);

    // TITLE
    doc.fontSize(18).text("Seed History Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Process Filter: ${process || "ALL"}`);
    doc.moveDown(2);

    // LIST DATA
    stocks.forEach((s, i) => {

      doc
        .fontSize(10)
        .text(
          `${i + 1}. ${s.tag || "NO-TAG"} | ${s.status} | Block: ${s.block ?? "-"} | Lot: ${s.lot ?? "-"}`
        );

    });

    doc.end();

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}