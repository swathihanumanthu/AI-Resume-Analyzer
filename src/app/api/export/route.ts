import { NextRequest, NextResponse } from 'next/server';
import { generateMarkdownReport } from '../../../lib/export/markdown-generator';
import { generatePdfHtmlReport } from '../../../lib/export/pdf-generator';
import { FullAnalysisResult } from '../../../types/analyzer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { format, analysis }: { format: 'json' | 'markdown' | 'pdf'; analysis: FullAnalysisResult } = body;

    if (!analysis) {
      return NextResponse.json({ success: false, error: 'Analysis payload is required for export.' }, { status: 400 });
    }

    const filenameBase = `ATS_Report_${(analysis.candidateName || 'Candidate').replace(/\s+/g, '_')}`;

    if (format === 'json') {
      return new NextResponse(JSON.stringify(analysis, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filenameBase}.json"`,
        },
      });
    }

    if (format === 'markdown') {
      const md = generateMarkdownReport(analysis);
      return new NextResponse(md, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filenameBase}.md"`,
        },
      });
    }

    if (format === 'pdf') {
      const html = generatePdfHtmlReport(analysis);
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="${filenameBase}.html"`,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid format. Supported: json, markdown, pdf' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Export error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
