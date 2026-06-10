import { Document, Packer, Paragraph, TextRun } from "docx"
import fs from "fs"

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ children: [new TextRun({ text: "Flowter Business Profile", bold: true, size: 28 })] }),
      new Paragraph({ children: [new TextRun("This is a test DOCX file for the knowledge base ingestion pipeline.")] }),
      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({ children: [new TextRun("Our company provides AI-powered customer service automation for WhatsApp, Webchat, and Email channels.")] }),
      new Paragraph({ children: [new TextRun("Key features include multi-agent AI orchestration, smart escalation, knowledge base integration, and 24/7 automated responses.")] }),
    ]
  }]
})

const buf = await Packer.toBuffer(doc)
fs.writeFileSync("C:/Users/PC/AppData/Local/Temp/test-doc.docx", buf)
console.log("DOCX created:", buf.length, "bytes")
