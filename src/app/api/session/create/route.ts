import { NextRequest, NextResponse } from 'next/server';
import { createCareerSession, buildPlatformDeepLinks, ResumeItemPayload } from '../../../../lib/bot/session-service';
import { FullAnalysisResult, MultiResumeAnalysisReport } from '../../../../types/analyzer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jdText, resumes, singleAnalysis, multiReport } = body as {
      jdText: string;
      resumes?: ResumeItemPayload[];
      singleAnalysis?: FullAnalysisResult;
      multiReport?: MultiResumeAnalysisReport;
    };

    if (!jdText && (!resumes || resumes.length === 0)) {
      return NextResponse.json({ success: false, error: 'Job description or resumes required.' }, { status: 400 });
    }

    const formattedResumes: ResumeItemPayload[] = (resumes || []).map((r, idx) => ({
      id: r.id || `cand_${idx + 1}`,
      candidateName: r.candidateName || `Candidate ${idx + 1}`,
      fileName: r.fileName || `Resume_${idx + 1}.pdf`,
      resumeText: r.resumeText || '',
      analysis: r.analysis,
    }));

    const session = createCareerSession(jdText || '', formattedResumes, singleAnalysis, multiReport);
    const deepLinks = buildPlatformDeepLinks(session.id);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      resumeCount: session.resumes.length,
      deepLinks,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create session';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('id') || undefined;
  const deepLinks = buildPlatformDeepLinks(sessionId);
  return NextResponse.json({ success: true, deepLinks });
}
