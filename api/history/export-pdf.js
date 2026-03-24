import dbConnect from "../../lib/db.js";
import ActivityLog from "../../models/ActivityLog.js";
import SeedStock from "../../models/SeedStock.js";
import path from "path";
import PDFDocument from "pdfkit";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { process = "ALL", month = "ALL" } = req.query;

    const activityFilter = {};
    const stockFilter = {};

    // Process filter
    if (process && process !== "ALL") {
      activityFilter.process = process;
      stockFilter.status = process;
    }

    // Month filter
    if (month && month !== "ALL") {
      const monthNum = parseInt(month, 10);

      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        const year = new Date().getFullYear();

        const startDate = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
        const endDate = new Date(year, monthNum, 1, 0, 0, 0, 0);

        activityFilter.createdAt = {
          $gte: startDate,
          $lt: endDate,
        };

        stockFilter.createdAt = {
          $gte: startDate,
          $lt: endDate,
        };
      }
    }

    // Activity Logs
    const logs = await ActivityLog.find(activityFilter)
      .select("user process seedName seedTag quantity block lot createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // Seed Stock
    const stocks = await SeedStock.find(stockFilter)
      .sort({ createdAt: -1 })
      .lean();

    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=seed-history-${process}-${month}.pdf`
    );

    doc.pipe(res);

    const rowHeight = 20;

    function drawWatermark() {
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
    }

    function formatMonthLabel(value) {
      if (!value || value === "ALL") return "ALL";

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const monthNum = parseInt(value, 10);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return value;

      return monthNames[monthNum - 1];
    }

    function formatProcessLabel(value) {
      switch (value) {
        case "AVAILABLE":
          return "AVAILABLE";
        case "STOCK-OUT":
          return "STOCK-OUT";
        case "MORTALITY":
          return "MORTALITY";
        case "ASSIGNED-LOT":
          return "ASSIGNED-LOT";
        case "PLANTED":
          return "ASSIGNED-LOT";
        case "DELETED":
          return "DELETED";
        case "CREATED":
          return "PROPAGATED";
        default:
          return value || "-";
      }
    }

    function formatDate(value) {
      if (!value) return "-";

      return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    }

    function drawHeader() {
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
        .text(`Process: ${formatProcessLabel(process)}`, { align: "center" });

      doc.text(`Month: ${formatMonthLabel(month)}`, { align: "center" });

      doc.text(
        `Generated: ${new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        { align: "center" }
      );

      doc.moveDown(2);
    }

    function addNewPage() {
      doc.addPage();
      drawWatermark();
      drawHeader();
    }

    function checkPageBreak(extraSpace = 0) {
      const bottomLimit = doc.page.height - doc.page.margins.bottom - 40;
      if (doc.y + extraSpace > bottomLimit) {
        addNewPage();
      }
    }

    function drawSectionTitle(title) {
      checkPageBreak(30);

      doc.moveDown(0.5);
      doc.font("Helvetica-Bold").fontSize(12).text(title);
      doc.moveDown(0.5);
    }

    // =========================
    // ACTIVITY LOGS TABLE
    // =========================
    function drawActivityTableHeader() {
      const y = doc.y;

      doc.font("Helvetica-Bold").fontSize(10);
      doc.text("#", 50, y);
      doc.text("Seed", 80, y);
      doc.text("Serial Number", 180, y);
      doc.text("Process", 300, y);
      doc.text("Qty", 405, y);
      doc.text("Date", 450, y);

      doc.moveTo(50, y + 15)
        .lineTo(545, y + 15)
        .stroke();

      doc.y = y + rowHeight;
      doc.font("Helvetica");
    }

    function renderActivityLogs() {
      drawSectionTitle("ACTIVITY LOGS");
      drawActivityTableHeader();

      if (logs.length === 0) {
        doc.text("No activity logs found.", 50, doc.y);
        doc.moveDown(2);
        return;
      }

      for (let i = 0; i < logs.length; i++) {
        checkPageBreak(rowHeight + 10);

        // redraw section header if new page was added
        const currentBottomLimit = doc.page.height - doc.page.margins.bottom - 40;
        if (doc.y <= 120) {
          drawSectionTitle("ACTIVITY LOGS");
          drawActivityTableHeader();
        }

        const item = logs[i];
        const y = doc.y;

        doc.text(String(i + 1), 50, y, { lineBreak: false });
        doc.text(item.seedName || "-", 80, y, {
          width: 90,
          lineBreak: false,
        });
        doc.text(item.seedTag || "-", 180, y, {
          width: 110,
          lineBreak: false,
        });
        doc.text(formatProcessLabel(item.process), 300, y, {
          width: 95,
          lineBreak: false,
        });
        doc.text(String(item.quantity ?? "-"), 405, y, {
          width: 30,
          lineBreak: false,
        });
        doc.text(formatDate(item.createdAt), 450, y, {
          width: 80,
          lineBreak: false,
        });

        doc.y = y + rowHeight;
      }

      doc.moveDown(1.5);
      doc.font("Helvetica-Bold");
      doc.text(`Total Activity Logs: ${logs.length}`, { align: "right" });
      doc.font("Helvetica");
      doc.moveDown(1);
    }

    // =========================
    // SEED STOCK TABLE
    // =========================
    function drawSeedStockTableHeader() {
      const y = doc.y;

      doc.font("Helvetica-Bold").fontSize(10);
      doc.text("#", 50, y);
      doc.text("Serial Number", 90, y);
      doc.text("Status", 300, y);
      doc.text("Block", 395, y);
      doc.text("Lot", 455, y);

      doc.moveTo(50, y + 15)
        .lineTo(540, y + 15)
        .stroke();

      doc.y = y + rowHeight;
      doc.font("Helvetica");
    }

    function renderSeedStocks() {
      drawSectionTitle("SEED STOCK");
      drawSeedStockTableHeader();

      if (stocks.length === 0) {
        doc.text("No seed stock records found.", 50, doc.y);
        doc.moveDown(2);
        return;
      }

      for (let i = 0; i < stocks.length; i++) {
        checkPageBreak(rowHeight + 10);

        if (doc.y <= 120) {
          drawSectionTitle("SEED STOCK");
          drawSeedStockTableHeader();
        }

        const s = stocks[i];
        const y = doc.y;

        doc.text(String(i + 1), 50, y, { lineBreak: false });
        doc.text(s.tag || "-", 90, y, {
          width: 190,
          lineBreak: false,
        });
        doc.text(formatProcessLabel(s.status), 300, y, {
          width: 80,
          lineBreak: false,
        });
        doc.text(String(s.block ?? "-"), 395, y, { lineBreak: false });
        doc.text(String(s.lot ?? "-"), 455, y, { lineBreak: false });

        doc.y = y + rowHeight;
      }

      doc.moveDown(1.5);
      doc.font("Helvetica-Bold");
      doc.text(`Total Seed Stocks: ${stocks.length}`, { align: "right" });
      doc.font("Helvetica");
      doc.moveDown(1);
    }

    // First page
    drawWatermark();
    drawHeader();

    renderActivityLogs();
    renderSeedStocks();

    doc.moveDown(1);
    doc.font("Helvetica-Bold");
    doc.text(
      `Grand Total Records: ${logs.length + stocks.length}`,
      { align: "right" }
    );

    doc.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}