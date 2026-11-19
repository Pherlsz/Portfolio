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
import {
  DEFAULT_PORTFOLIO_DATA,
  availabilityLine,
  experienceSpan,
  formatPeriod,
  plainText,
  skillNames
} from '../src/data/portfolioData.ts';

const data = DEFAULT_PORTFOLIO_DATA;

function sectionHeading(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
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
        text: data.profile.name,
        bold: true,
        size: 36,
        color: '141513'
      })
    ]
  }),
  new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text: `${data.profile.jobTitle} · ${data.profile.location}`,
        bold: true,
        size: 22,
        color: '3F423C'
      })
    ]
  }),
  new Paragraph({
    spacing: { after: 140 },
    children: [
      new TextRun({
        text: `${data.profile.email} · ${data.profile.linkedin} · ${data.profile.github}`,
        size: 19,
        color: '686C64'
      })
    ]
  }),
  new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: data.profile.headline, bold: true, size: 21 })]
  }),
  new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: plainText(data.profile.summary), size: 20 })]
  }),
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: availabilityLine(data.profile), size: 19, color: '3F423C' })]
  })
];

children.push(sectionHeading('Experiência'));

for (const exp of data.experiences) {
  const span = experienceSpan(exp);
  children.push(
    new Paragraph({
      spacing: { before: 140, after: 40 },
      children: [
        new TextRun({ text: exp.company, bold: true, size: 22 }),
        new TextRun({
          text: ` · ${exp.location} · ${formatPeriod(span.start, span.end)}`,
          size: 19,
          color: '686C64'
        })
      ]
    })
  );

  for (const role of exp.roles) {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: role.title, bold: true, size: 20, color: '3F423C' }),
          new TextRun({
            text: ` (${formatPeriod(role.start, role.end)})`,
            size: 19,
            color: '686C64'
          })
        ]
      })
    );
  }

  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: exp.summary, size: 20 })]
    })
  );

  for (const highlight of exp.highlights) {
    const runs = [];
    if (highlight.metric) {
      runs.push(new TextRun({ text: `${highlight.metric}: `, bold: true, size: 19 }));
    }
    runs.push(new TextRun({ text: highlight.text, size: 19 }));
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: runs
      })
    );
  }
}

children.push(sectionHeading('Projetos principais'));
for (const project of data.projects.filter((p) => p.kind !== 'portfolio-version')) {
  children.push(
    new Paragraph({
      spacing: { before: 100, after: 40 },
      children: [
        new TextRun({ text: project.name, bold: true, size: 21 }),
        new TextRun({
          text: project.repoUrl ? ` · ${project.repoUrl}` : '',
          size: 18,
          color: '686C64'
        })
      ]
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: project.tagline, size: 19 })]
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `Stack: ${project.stack.join(', ')}`, size: 18, color: '686C64' })
      ]
    })
  );
}

children.push(sectionHeading('Stack técnica'));
for (const group of data.skills) {
  children.push(
    new Paragraph({
      spacing: { after: 50 },
      children: [
        new TextRun({ text: `${group.name}: `, bold: true, size: 20 }),
        new TextRun({ text: skillNames(group).join(', '), size: 19 })
      ]
    })
  );
}

children.push(sectionHeading('Formação e certificações'));
for (const edu of data.education) {
  children.push(
    new Paragraph({
      spacing: { after: 50 },
      children: [
        new TextRun({ text: edu.course, bold: true, size: 20 }),
        new TextRun({ text: ` · ${edu.school} (${edu.period})`, size: 19, color: '686C64' })
      ]
    })
  );
}
for (const cert of data.certificates) {
  children.push(
    new Paragraph({
      bullet: { level: 0 },
      spacing: { after: 40 },
      children: [
        new TextRun({ text: cert.title, bold: true, size: 19 }),
        new TextRun({ text: ` · ${cert.issuer} (${cert.issuedAt})`, size: 19, color: '686C64' })
      ]
    })
  );
}

children.push(sectionHeading('Idiomas'));
for (const lang of data.languages) {
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: `${lang.name}: `, bold: true, size: 19 }),
        new TextRun({ text: lang.level, size: 19 })
      ]
    })
  );
}

const doc = new Document({
  creator: data.profile.name,
  title: `Currículo - ${data.profile.name}`,
  description: data.profile.headline,
  sections: [{ children }]
});

const outPath = path.resolve(import.meta.dirname, '../public/cv/Pedro-Henrique-Lopes-CV.docx');
const buffer = await Packer.toBuffer(doc);
await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, buffer);
console.log(`Generated ${outPath} (${buffer.byteLength} bytes)`);
