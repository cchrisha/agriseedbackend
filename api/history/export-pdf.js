// import dbConnect from "../../lib/db.js";
// import SeedStock from "../../models/SeedStock.js";
// import path from "path";
// import PDFDocument from "pdfkit";

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ message: "Method not allowed" });
//   }

//   try {
//     await dbConnect();

//     const { process = "ALL", month = "ALL" } = req.query;

//     let filter = {};

//     if (process && process !== "ALL") {
//       filter.status = process;
//     }

//     if (month && month !== "ALL") {
//       const monthNum = parseInt(month, 10);

//       if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
//         const now = new Date();
//         const year = now.getFullYear();

//         const startDate = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
//         const endDate = new Date(year, monthNum, 1, 0, 0, 0, 0);

//         filter.createdAt = {
//           $gte: startDate,
//           $lt: endDate,
//         };
//       }
//     }

//     const stocks = await SeedStock.find(filter)
//       .sort({ createdAt: -1 })
//       .populate("seed");

//     const doc = new PDFDocument({
//       margin: 50,
//       size: "A4",
//     });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=seed-history-${process}-${month}.pdf`
//     );

//     doc.pipe(res);

//     const col1 = 50;
//     const col2 = 80;
//     const col3 = 250;
//     const col4 = 340;
//     const col5 = 410;
//     const col6 = 460;
//     const rowHeight = 20;

//     function formatMonthLabel(value) {
//       if (!value || value === "ALL") return "ALL";

//       const monthNames = [
//         "January",
//         "February",
//         "March",
//         "April",
//         "May",
//         "June",
//         "July",
//         "August",
//         "September",
//         "October",
//         "November",
//         "December",
//       ];

//       const monthNum = parseInt(value, 10);
//       if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return value;

//       return monthNames[monthNum - 1];
//     }

//     function formatDate(date) {
//       if (!date) return "-";

//       return new Date(date).toLocaleDateString("en-US", {
//         year: "numeric",
//         month: "2-digit",
//         day: "2-digit",
//       });
//     }

//     function drawWatermark() {
//       try {
//         const watermarkPath = path.resolve("./public/da.png");

//         doc.save();
//         doc.opacity(0.08);
//         doc.image(
//           watermarkPath,
//           (doc.page.width - 350) / 2,
//           (doc.page.height - 350) / 2,
//           { width: 350 }
//         );
//         doc.restore();
//       } catch (e) {
//         console.log("Watermark not loaded");
//       }
//     }

//     function drawHeader() {
//       doc
//         .font("Helvetica-Bold")
//         .fontSize(16)
//         .text("DEPARTMENT OF AGRICULTURE", { align: "center" });

//       doc
//         .fontSize(14)
//         .text("PREC STA. BARBARA", { align: "center" });

//       doc.moveDown(1);

//       doc
//         .fontSize(14)
//         .text("Seed History Report", { align: "center" });

//       doc.moveDown(0.5);

//       doc
//         .font("Helvetica")
//         .fontSize(10)
//         .text(`Process: ${process}`, { align: "center" });

//       doc.text(`Month: ${formatMonthLabel(month)}`, { align: "center" });

//       doc.text(
//         `Generated: ${new Date().toLocaleDateString("en-US", {
//           year: "numeric",
//           month: "long",
//           day: "numeric",
//         })}`,
//         { align: "center" }
//       );

//       doc.moveDown(2);
//     }

//     function drawTableHeader() {
//       const y = doc.y;

//       doc.font("Helvetica-Bold").fontSize(10);
//       doc.text("#", col1, y);
//       doc.text("Serial Number", col2, y);
//       doc.text("Status", col3, y);
//       doc.text("Date", col4, y);
//       doc.text("Block", col5, y);
//       doc.text("Lot", col6, y);

//       doc.moveTo(col1, y + 15)
//         .lineTo(545, y + 15)
//         .stroke();

//       doc.y = y + rowHeight;
//       doc.font("Helvetica");
//     }

//     function addNewPage() {
//       doc.addPage();
//       drawWatermark();
//       drawHeader();
//       drawTableHeader();
//     }

//     drawWatermark();
//     drawHeader();
//     drawTableHeader();

//     for (let i = 0; i < stocks.length; i++) {
//       const s = stocks[i];

//       const bottomLimit = doc.page.height - doc.page.margins.bottom - 40;
//       if (doc.y + rowHeight > bottomLimit) {
//         addNewPage();
//       }

//       const y = doc.y;

//       doc.text(String(i + 1), col1, y, { lineBreak: false });
//       doc.text(s.tag || "-", col2, y, { width: 150, lineBreak: false });
//       doc.text(s.status || "-", col3, y, { width: 80, lineBreak: false });
//       doc.text(formatDate(s.createdAt), col4, y, {
//         width: 60,
//         lineBreak: false,
//       });
//       doc.text(String(s.block ?? "-"), col5, y, { lineBreak: false });
//       doc.text(String(s.lot ?? "-"), col6, y, { lineBreak: false });

//       doc.y = y + rowHeight;
//     }

//     doc.moveDown(2);
//     doc.font("Helvetica-Bold");
//     doc.text(`Total Records: ${stocks.length}`, { align: "right" });

//     doc.end();
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: err.message });
//   }
// }

import dbConnect from "../../lib/db.js";
import ActivityLog from "../../models/ActivityLog.js";
import PDFDocument from "pdfkit";

export default async function handler(req, res) {
  await dbConnect();

  try {
    const { process = "ALL", month = "ALL" } = req.query;

    let filter = {};

    if (process !== "ALL") {
      filter.process = process;
    }

    if (month !== "ALL") {
      const m = parseInt(month);
      const year = new Date().getFullYear();

      filter.createdAt = {
        $gte: new Date(year, m - 1, 1),
        $lt: new Date(year, m, 1),
      };
    }

    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=audit-logs.pdf`
    );

    doc.pipe(res);

    // HEADER
    doc.fontSize(16).text("Audit Logs Report", { align: "center" });
    doc.moveDown();

    let rowY = doc.y;

    doc.fontSize(10);

    // TABLE HEADER
    doc.text("#", 50, rowY);
    doc.text("Seed", 80, rowY);
    doc.text("Process", 200, rowY);
    doc.text("Qty", 300, rowY);
    doc.text("Date", 350, rowY);

    rowY += 20;

    let counter = 1;

    for (let item of logs) {
      if (rowY > 750) {
        doc.addPage();
        rowY = 50;
      }

      doc.text(counter.toString(), 50, rowY);
      doc.text(item.seedName || "-", 80, rowY);
      doc.text(item.process || "-", 200, rowY);
      doc.text(String(item.quantity || 0), 300, rowY);
      doc.text(
        new Date(item.createdAt).toLocaleDateString(),
        350,
        rowY
      );

      rowY += 20;
      counter++;
    }

    doc.text(`Total Records: ${logs.length}`, { align: "right" });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}