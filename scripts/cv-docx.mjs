import fs from 'node:fs/promises';
import path from 'node:path';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun
} from 'docx';
import { CV_DATA } from '../src/data/cvData.ts';

const shortUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

function sectionHeading(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    border: {
      bottom: {
        color: 'D4D4CF',
        size: 6,
        space: 4,
        style: BorderStyle.SINGLE
      }
    },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: 20,
        color: '141513'
      })
    ]
  });
}

const children = [
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: CV_DATA.name,
        bold: true,
        size: 36,
        color: '141513'
      })
    ]
  }),
  new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: CV_DATA.title,
        size: 21,
        color: '1D5FA7'
      })
    ]
  }),
  new Paragraph({
    spacing: { after: 140 },
    children: [
      new TextRun({
        text: `${CV_DATA.email} | ${CV_DATA.phone} | ${shortUrl(CV_DATA.linkedin)} | ${shortUrl(CV_DATA.github)} | ${shortUrl(CV_DATA.website)} | ${CV_DATA.location}`,
        size: 18,
        color: '3F423C'
      })
    ]
  }),

  sectionHeading('Resumo Profissional'),
  new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text: CV_DATA.summary, size: 20, color: '141513' })]
  }),

  sectionHeading('Experiência Profissional')
];

for (const exp of CV_DATA.experience) {
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 40 },
      children: [
        new TextRun({ text: `${exp.company} — ${exp.role}`, bold: true, size: 21, color: '141513' })
      ]
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: exp.period, italics: true, size: 19, color: '555852' })]
    })
  );

  for (const highlight of exp.highlights) {
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 50 },
        children: [new TextRun({ text: highlight, size: 19, color: '141513' })]
      })
    );
  }
}

children.push(sectionHeading('Formação Acadêmica'));
for (const edu of CV_DATA.education) {
  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `${edu.course} | ${edu.institution} (${edu.period})`,
          size: 19,
          color: '141513'
        })
      ]
    })
  );
}

children.push(sectionHeading('Habilidades'));
children.push(
  new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: 'Técnicas: ', bold: true, size: 19, color: '141513' }),
      new TextRun({ text: `${CV_DATA.skills.technical.join(', ')}.`, size: 19, color: '141513' })
    ]
  })
);
children.push(
  new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: 'Comportamentais: ', bold: true, size: 19, color: '141513' }),
      new TextRun({ text: `${CV_DATA.skills.behavioral.join(', ')}.`, size: 19, color: '141513' })
    ]
  })
);
children.push(
  new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: 'Idiomas: ', bold: true, size: 19, color: '141513' }),
      new TextRun({
        text: `${CV_DATA.languages.map((l) => `${l.name} (${l.level})`).join(', ')}.`,
        size: 19,
        color: '141513'
      })
    ]
  })
);

children.push(sectionHeading('Certificações'));
for (const cert of CV_DATA.certifications) {
  children.push(
    new Paragraph({
      bullet: { level: 0 },
      spacing: { after: 50 },
      children: [
        new TextRun({
          text: `${cert.name} — ${cert.issuer} (${cert.year})`,
          size: 19,
          color: '141513'
        })
      ]
    })
  );
}

const doc = new Document({
  creator: CV_DATA.name,
  title: `Currículo - ${CV_DATA.name}`,
  description: CV_DATA.title,
  sections: [{ children }]
});

const outPath = path.resolve(import.meta.dirname, '../public/cv/Pedro-Henrique-Lopes-CV.docx');
const buffer = await Packer.toBuffer(doc);
await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, buffer);
console.log(`Generated ${outPath} (${buffer.byteLength} bytes)`);
