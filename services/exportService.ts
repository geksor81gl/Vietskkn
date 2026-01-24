import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, PageSize, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { FormData } from "../types";

export const exportToWord = async (formData: FormData, title: string, content: string) => {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            width: 11906, // A4 Width
            height: 16838, // A4 Height
          },
          margin: {
            top: 1134,    // 2cm
            right: 850,   // 1.5cm
            bottom: 1134, // 2cm
            left: 1701,   // 3cm
          },
        },
      },
      children: [
        // Header info
        new Paragraph({
          children: [
            new TextRun({ text: formData.school.toUpperCase(), bold: true, size: 24, font: "Times New Roman" }),
          ],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "--------------------------", size: 24, font: "Times New Roman" }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // Main Title
        new Paragraph({
          children: [
            new TextRun({ text: "SÁNG KIẾN KINH NGHIỆM", bold: true, size: 28, font: "Times New Roman" }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `ĐỀ TÀI: ${formData.title.toUpperCase()}`, bold: true, size: 32, font: "Times New Roman" }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 },
        }),

        // Section Title
        new Paragraph({
          text: title.toUpperCase(),
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.LEFT,
          spacing: { before: 400, after: 200 },
        }),

        // Body Content
        ...content.split('\n').map(line => {
          return new Paragraph({
            children: [
              new TextRun({
                text: line.trim(),
                size: 26, // 13pt
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 360 }, // 1.5 line spacing
          });
        }),

        // Footer location
        new Paragraph({
          children: [
            new TextRun({ text: `${formData.location}, ngày ... tháng ... năm ...`, italics: true, size: 24, font: "Times New Roman" }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { before: 800 },
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `SKKN_${formData.title.substring(0, 30).replace(/\s+/g, '_')}_${title}.docx`);
};