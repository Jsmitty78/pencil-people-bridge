"use client";

import { useEffect, useMemo, useState } from "react";
import PipelineLab from "./PipelineLab";

type Source = "Backlog" | "Chatwork" | "会議記録" | "Box";
type Severity = "high" | "medium" | "normal";
type Status = "未確認" | "面談候補" | "確認済み" | "誤検知";
type View = "overview" | "pipeline" | "review" | "architecture";
type Lang = "ja" | "en";
type Evidence = { source: Source; date: string; role: string; text: string; flagged?: boolean };
type ReviewCase = {
  id: string; title: string; owner: string; severity: Severity; status: Status;
  signal: string; summary: string; rework: number; average: number;
  confidence: number; question: string; evidence: Evidence[]; foreignStaff?: boolean;
};

const INITIAL_CASES: ReviewCase[] = [
  {
    id: "BLG-1234", title: "LPデザイン改修", owner: "制作案件 A", severity: "high", status: "未確認",
    signal: "会議決定と後続指示の不一致",
    summary: "会議では要素を絞る方針でしたが、2日後のChatworkで情報量を増やす指示が出ています。5回の手戻りも確認されました。",
    rework: 5, average: 2.1, confidence: 92,
    question: "途中で方針が変わった背景と、最終的な正しい方針はどちらだったか確認できますか？",
    evidence: [
      { source: "会議記録", date: "8月16日 10:42", role: "最終確認者", text: "今回はシンプルさを優先し、要素を3点に絞って進める。", flagged: true },
      { source: "Backlog", date: "8月18日 14:08", role: "作業担当", text: "会議方針に基づき、要素を3点に整理した初稿を提出します。" },
      { source: "Chatwork", date: "8月20日 09:31", role: "中間確認者", text: "訴求ポイントをもっと追加してください。情報量を増やしたいです。", flagged: true },
    ],
  },
  {
    id: "BLG-1189", title: "サイト改修方針", owner: "Web案件 B", severity: "medium", status: "未確認",
    signal: "記録されていない口頭決定",
    summary: "Chatwork内で口頭指示への参照が2回ありますが、紐づく会議記録やBacklogの決定ログが見つかりません。",
    rework: 2, average: 2.1, confidence: 84,
    question: "口頭で決まった仕様と決定理由を、今からでもBacklogに残せますか？",
    evidence: [
      { source: "Backlog", date: "8月19日 11:22", role: "作業担当", text: "トップページ改修案を提出しました。決定理由の記録場所は未確認です。" },
      { source: "Chatwork", date: "8月20日 16:15", role: "中間確認者", text: "昨日口頭で確認した内容と同じ方針で進めてください。", flagged: true },
      { source: "Chatwork", date: "8月21日 10:04", role: "最終確認者", text: "先ほど話した仕様に変更しておいてください。", flagged: true },
    ],
  },
  {
    id: "INT-2041", title: "外国籍スタッフのキャンペーン納期", owner: "国際案件 C", severity: "high", status: "未確認", foreignStaff: true,
    signal: "チャネル間で締切日が不一致",
    summary: "会議では金曜日17時が締切でしたが、Chatworkでは木曜日午前中の提出が求められています。",
    rework: 2, average: 2.1, confidence: 95,
    question: "正式な締切は木曜日と金曜日のどちらで、変更はどこに記録されましたか？",
    evidence: [
      { source: "会議記録", date: "8月18日 10:10", role: "プロジェクト管理者", text: "初稿は金曜日17時までです。不明点は英語で質問してください。", flagged: true },
      { source: "Backlog", date: "8月18日 13:05", role: "外国籍スタッフ", text: "金曜日17時までに英語版の初稿を提出します。" },
      { source: "Chatwork", date: "8月20日 09:12", role: "確認者", text: "クライアント会議前に確認したいので、木曜日午前中までに完成してください。", flagged: true },
    ],
  },
  {
    id: "INT-2046", title: "外国籍スタッフ向けオンボーディング資料", owner: "人事案件 D", severity: "medium", status: "未確認", foreignStaff: true,
    signal: "必要な言語版がチャネル間で不一致",
    summary: "会議では日英両方の資料が必要とされましたが、Backlogでは日本語版のみの作成指示になっています。",
    rework: 3, average: 2.1, confidence: 91,
    question: "外国籍スタッフ向けの英語版は必要ですか。最終方針をどこに記録しますか？",
    evidence: [
      { source: "会議記録", date: "8月19日 11:00", role: "HR責任者", text: "新しい外国籍スタッフが理解できるよう、英語版と日本語版の両方を作成します。", flagged: true },
      { source: "Backlog", date: "8月19日 14:20", role: "コンテンツ責任者", text: "日本語のみで作成してください。英語版は不要です。", flagged: true },
      { source: "Chatwork", date: "8月20日 10:35", role: "外国籍スタッフ確認者", text: "英語版を確認できますが、日本語の資料しか見つかりません。" },
    ],
  },
  {
    id: "HR-031", title: "日報の提出ルール", owner: "人事運用 E", severity: "high", status: "未確認",
    signal: "日報の提出期限が不一致",
    summary: "会議では業務終了時の提出、Backlogでは翌朝10時までの提出と記録されています。",
    rework: 4, average: 2.1, confidence: 93,
    question: "日報の正式な締切は退勤前と翌朝10時のどちらですか？",
    evidence: [
      { source: "会議記録", date: "8月18日 09:30", role: "チーム管理者", text: "日報は各自の業務終了時、当日中に提出してください。", flagged: true },
      { source: "Backlog", date: "8月18日 12:15", role: "運用担当", text: "日報は毎朝10時までに提出する運用です。", flagged: true },
      { source: "Chatwork", date: "8月19日 10:20", role: "スタッフ", text: "昨日の退勤前に提出しましたが、今朝は未提出と連絡がありました。" },
    ],
  },
  {
    id: "WEB-221", title: "レスポンシブ対応範囲", owner: "Web案件 F", severity: "high", status: "未確認",
    signal: "納品範囲が途中で変更",
    summary: "会議ではモバイル版のみが対象でしたが、後続指示ではデスクトップ版も今回の納品に追加されています。",
    rework: 4, average: 2.1, confidence: 92,
    question: "デスクトップ版を追加した決定と納期への影響は記録されていますか？",
    evidence: [
      { source: "会議記録", date: "8月17日 15:00", role: "プロジェクト管理者", text: "今回は納期を優先し、モバイル版のみを対象にします。", flagged: true },
      { source: "Backlog", date: "8月18日 09:45", role: "開発担当", text: "モバイル版の実装を開始しました。" },
      { source: "Chatwork", date: "8月20日 14:22", role: "確認者", text: "デスクトップ版とモバイル版の両方を今回の納品に含めてください。", flagged: true },
    ],
  },
  {
    id: "ADV-089", title: "広告公開の承認フロー", owner: "広告案件 G", severity: "medium", status: "未確認",
    signal: "最終承認者が不一致",
    summary: "会議では部長の最終承認が必要ですが、Chatworkではチームリーダーの確認で公開可能とされています。",
    rework: 1, average: 2.1, confidence: 89,
    question: "公開前の正式な最終承認者は誰ですか？",
    evidence: [
      { source: "会議記録", date: "8月20日 13:00", role: "案件責任者", text: "公開前の最終承認は部長が行います。承認前には配信しません。", flagged: true },
      { source: "Chatwork", date: "8月21日 09:08", role: "チームリーダー", text: "チームリーダーの確認で公開して大丈夫です。今日中に配信してください。", flagged: true },
      { source: "Backlog", date: "8月21日 09:35", role: "運用担当", text: "最終承認者が異なるため、公開を保留しています。" },
    ],
  },
  {
    id: "OPS-074", title: "クライアントへのファイル納品方法", owner: "運用案件 H", severity: "medium", status: "未確認",
    signal: "納品方法がチャネル間で不一致",
    summary: "会議ではメール添付、Backlogでは共有リンクでの納品が指示されています。",
    rework: 2, average: 2.1, confidence: 88,
    question: "クライアントが承認した正式な納品方法はどちらですか？",
    evidence: [
      { source: "会議記録", date: "8月18日 16:00", role: "クライアント担当", text: "最終ファイルはメール添付で納品します。", flagged: true },
      { source: "Backlog", date: "8月19日 10:30", role: "進行担当", text: "納品はBacklogの共有リンクを使用してください。メール添付は不要です。", flagged: true },
      { source: "Chatwork", date: "8月19日 11:15", role: "作業担当", text: "メール添付とBacklogリンクのどちらが正式な方法でしょうか。" },
    ],
  },
  {
    id: "INT-2052", title: "外国籍スタッフ向け日本語表現ルール", owner: "国際案件 I", severity: "high", status: "未確認", foreignStaff: true,
    signal: "日本語の文体ルールが不一致",
    summary: "研修では分かりやすい日本語を優先すると説明されましたが、後続指示では正式な敬語が必須とされています。",
    rework: 4, average: 2.1, confidence: 90,
    question: "社内文書で外国籍スタッフに求める正式な文体ルールはどちらですか？",
    evidence: [
      { source: "会議記録", date: "8月19日 16:30", role: "研修担当", text: "社内の初稿では平易な日本語で構いません。完璧な敬語より分かりやすさを優先します。", flagged: true },
      { source: "Chatwork", date: "8月20日 09:50", role: "確認者", text: "社内文書でも必ず正式な敬語を使ってください。カジュアルな日本語は修正してください。", flagged: true },
      { source: "Backlog", date: "8月20日 13:25", role: "外国籍スタッフ", text: "正式な日本語に書き直しましたが、今後どちらのルールを使うか分かりません。" },
    ],
  },
  {
    id: "BLG-1280", title: "月次レポート更新", owner: "レポート案件 J", severity: "normal", status: "確認済み",
    signal: "不一致なし", summary: "会議記録とBacklogのテンプレート・納期・成果物が一致しています。追加確認は不要です。",
    rework: 0, average: 2.1, confidence: 97, question: "追加確認は不要です。",
    evidence: [
      { source: "会議記録", date: "8月20日 10:00", role: "レポート責任者", text: "月次レポートは既存テンプレートを使い、金曜日17時までに提出します。" },
      { source: "Backlog", date: "8月20日 10:35", role: "作業担当", text: "既存テンプレートで作成し、金曜日17時までに提出します。" },
    ],
  },
];

const sourceMeta: Record<Source, { letter: string; className: string }> = {
  Backlog: { letter: "B", className: "backlog" },
  Chatwork: { letter: "C", className: "chatwork" },
  会議記録: { letter: "M", className: "meeting" },
  Box: { letter: "X", className: "box" },
};
const statusClass: Record<Status, string> = { 未確認: "new", 面談候補: "queued", 確認済み: "done", 誤検知: "dismissed" };

const EN: Record<string, string> = {
  "LPデザイン改修": "Landing Page Design Revision",
  "制作案件 A": "Creative Project A",
  "会議決定と後続指示の不一致": "Meeting decision conflicts with later instruction",
  "会議では要素を絞る方針でしたが、2日後のChatworkで情報量を増やす指示が出ています。5回の手戻りも確認されました。": "The meeting established a simpler three-element direction, but a Chatwork instruction two days later requested more content. Five rework cycles were also recorded.",
  "途中で方針が変わった背景と、最終的な正しい方針はどちらだったか確認できますか？": "Could you confirm why the direction changed and which instruction represented the final decision?",
  "8月16日 10:42": "Aug 16, 10:42",
  "8月18日 14:08": "Aug 18, 14:08",
  "8月20日 09:31": "Aug 20, 09:31",
  "最終確認者": "Final reviewer",
  "作業担当": "Contributor",
  "中間確認者": "Intermediate reviewer",
  "今回はシンプルさを優先し、要素を3点に絞って進める。": "Prioritize simplicity for this version and proceed with only three key elements.",
  "会議方針に基づき、要素を3点に整理した初稿を提出します。": "I am submitting a first draft organized around three elements, based on the meeting decision.",
  "訴求ポイントをもっと追加してください。情報量を増やしたいです。": "Please add more selling points. I would like to increase the amount of information.",
  "サイト改修方針": "Website Revision Direction",
  "Web案件 B": "Web Project B",
  "記録されていない口頭決定": "Undocumented verbal decision",
  "Chatwork内で口頭指示への参照が2回ありますが、紐づく会議記録やBacklogの決定ログが見つかりません。": "Two Chatwork messages refer to verbal instructions, but no related meeting record or Backlog decision log was found.",
  "口頭で決まった仕様と決定理由を、今からでもBacklogに残せますか？": "Could the verbally agreed specification and its rationale be documented in Backlog now?",
  "8月19日 11:22": "Aug 19, 11:22",
  "8月20日 16:15": "Aug 20, 16:15",
  "8月21日 10:04": "Aug 21, 10:04",
  "8月18日 10:10": "Aug 18, 10:10",
  "8月18日 13:05": "Aug 18, 13:05",
  "8月20日 09:12": "Aug 20, 09:12",
  "8月19日 11:00": "Aug 19, 11:00",
  "8月19日 14:20": "Aug 19, 14:20",
  "8月18日 09:30": "Aug 18, 09:30",
  "8月18日 12:15": "Aug 18, 12:15",
  "8月19日 10:20": "Aug 19, 10:20",
  "8月17日 15:00": "Aug 17, 15:00",
  "8月18日 09:45": "Aug 18, 09:45",
  "8月20日 14:22": "Aug 20, 14:22",
  "8月20日 13:00": "Aug 20, 13:00",
  "8月21日 09:08": "Aug 21, 09:08",
  "8月21日 09:35": "Aug 21, 09:35",
  "8月18日 16:00": "Aug 18, 16:00",
  "8月19日 10:30": "Aug 19, 10:30",
  "8月19日 11:15": "Aug 19, 11:15",
  "8月19日 16:30": "Aug 19, 16:30",
  "8月20日 09:50": "Aug 20, 09:50",
  "8月20日 13:25": "Aug 20, 13:25",
  "トップページ改修案を提出しました。決定理由の記録場所は未確認です。": "I submitted the homepage revision proposal. I have not confirmed where the decision rationale was recorded.",
  "昨日口頭で確認した内容と同じ方針で進めてください。": "Please proceed with the same direction we confirmed verbally yesterday.",
  "先ほど話した仕様に変更しておいてください。": "Please change it to the specification we discussed earlier.",
  "外国籍スタッフのキャンペーン納期": "Foreign Staff Campaign Deadline",
  "国際案件 C": "International Project C",
  "チャネル間で締切日が不一致": "Deadline mismatch across channels",
  "会議では金曜日17時が締切でしたが、Chatworkでは木曜日午前中の提出が求められています。": "The meeting set Friday at 5:00 PM, but Chatwork requests submission on Thursday morning.",
  "正式な締切は木曜日と金曜日のどちらで、変更はどこに記録されましたか？": "Is the official deadline Thursday or Friday, and where was the change recorded?",
  "プロジェクト管理者": "Project manager",
  "初稿は金曜日17時までです。不明点は英語で質問してください。": "The first draft is due Friday at 5:00 PM. Please ask in English if anything is unclear.",
  "外国籍スタッフ": "Foreign staff",
  "金曜日17時までに英語版の初稿を提出します。": "I will submit the English first draft by Friday at 5:00 PM.",
  "確認者": "Reviewer",
  "クライアント会議前に確認したいので、木曜日午前中までに完成してください。": "Please finish it by Thursday morning so we can review it before the client meeting.",
  "外国籍スタッフ向けオンボーディング資料": "Bilingual Onboarding Manual",
  "人事案件 D": "HR Project D",
  "必要な言語版がチャネル間で不一致": "Required language versions do not match",
  "会議では日英両方の資料が必要とされましたが、Backlogでは日本語版のみの作成指示になっています。": "The meeting requested both English and Japanese, but Backlog instructs the team to create only a Japanese version.",
  "外国籍スタッフ向けの英語版は必要ですか。最終方針をどこに記録しますか？": "Is an English version required for foreign staff, and where will the final decision be recorded?",
  "HR責任者": "HR lead",
  "新しい外国籍スタッフが理解できるよう、英語版と日本語版の両方を作成します。": "Create both English and Japanese versions so new foreign staff can understand the process.",
  "コンテンツ責任者": "Content owner",
  "日本語のみで作成してください。英語版は不要です。": "Create the Japanese version only. An English version is not needed.",
  "外国籍スタッフ確認者": "Foreign staff reviewer",
  "英語版を確認できますが、日本語の資料しか見つかりません。": "I can review the English version, but I only see the Japanese document.",
  "日報の提出ルール": "Daily Report Submission Rule",
  "人事運用 E": "HR Operations E",
  "日報の提出期限が不一致": "Daily report deadline mismatch",
  "会議では業務終了時の提出、Backlogでは翌朝10時までの提出と記録されています。": "The meeting says reports are due at the end of the workday, while Backlog records a 10:00 AM deadline.",
  "日報の正式な締切は退勤前と翌朝10時のどちらですか？": "Is the official daily report deadline before leaving or 10:00 AM the next morning?",
  "チーム管理者": "Team manager",
  "日報は各自の業務終了時、当日中に提出してください。": "Submit the daily report at the end of your workday.",
  "運用担当": "Operations",
  "日報は毎朝10時までに提出する運用です。": "The daily report should be submitted by 10:00 AM each morning.",
  "スタッフ": "Staff member",
  "昨日の退勤前に提出しましたが、今朝は未提出と連絡がありました。": "I submitted it before leaving yesterday, but this morning I was told it was missing.",
  "レスポンシブ対応範囲": "Responsive Page Scope",
  "Web案件 F": "Web Project F",
  "納品範囲が途中で変更": "Delivery scope changed during execution",
  "会議ではモバイル版のみが対象でしたが、後続指示ではデスクトップ版も今回の納品に追加されています。": "The meeting limited the scope to mobile, but a later instruction adds desktop to the same delivery.",
  "デスクトップ版を追加した決定と納期への影響は記録されていますか？": "Was the decision to add desktop and its deadline impact recorded?",
  "今回は納期を優先し、モバイル版のみを対象にします。": "To prioritize the deadline, this delivery will cover mobile only.",
  "開発担当": "Developer",
  "モバイル版の実装を開始しました。": "I started implementing the mobile version.",
  "デスクトップ版とモバイル版の両方を今回の納品に含めてください。": "Include both desktop and mobile versions in this delivery.",
  "広告公開の承認フロー": "Advertisement Release Approval",
  "広告案件 G": "Advertising Project G",
  "最終承認者が不一致": "Final approver mismatch",
  "会議では部長の最終承認が必要ですが、Chatworkではチームリーダーの確認で公開可能とされています。": "The meeting requires final director approval, while Chatwork says team-lead confirmation is sufficient.",
  "公開前の正式な最終承認者は誰ですか？": "Who is the official final approver before release?",
  "案件責任者": "Account owner",
  "公開前の最終承認は部長が行います。承認前には配信しません。": "The director gives final approval. Do not publish before approval.",
  "チームリーダー": "Team lead",
  "チームリーダーの確認で公開して大丈夫です。今日中に配信してください。": "Team-lead confirmation is enough. Please publish it today.",
  "最終承認者が異なるため、公開を保留しています。": "Release is paused because the final approver differs across the records.",
  "クライアントへのファイル納品方法": "Client File Delivery Method",
  "運用案件 H": "Operations Project H",
  "納品方法がチャネル間で不一致": "Delivery method mismatch across channels",
  "会議ではメール添付、Backlogでは共有リンクでの納品が指示されています。": "The meeting requests an email attachment, while Backlog requests delivery through a shared link.",
  "クライアントが承認した正式な納品方法はどちらですか？": "Which delivery method did the client officially approve?",
  "クライアント担当": "Client lead",
  "最終ファイルはメール添付で納品します。": "Deliver the final file as an email attachment.",
  "進行担当": "Project coordinator",
  "納品はBacklogの共有リンクを使用してください。メール添付は不要です。": "Use a Backlog shared link for delivery. An email attachment is unnecessary.",
  "メール添付とBacklogリンクのどちらが正式な方法でしょうか。": "Which is the official method, an email attachment or a Backlog link?",
  "外国籍スタッフ向け日本語表現ルール": "Japanese Tone for Foreign Staff",
  "国際案件 I": "International Project I",
  "日本語の文体ルールが不一致": "Japanese writing-style rule mismatch",
  "研修では分かりやすい日本語を優先すると説明されましたが、後続指示では正式な敬語が必須とされています。": "Training prioritized clear Japanese, but a later instruction requires formal keigo.",
  "社内文書で外国籍スタッフに求める正式な文体ルールはどちらですか？": "What is the official writing-style rule for foreign staff in internal documents?",
  "研修担当": "Trainer",
  "社内の初稿では平易な日本語で構いません。完璧な敬語より分かりやすさを優先します。": "Plain Japanese is acceptable for internal drafts. Clarity matters more than perfect keigo.",
  "社内文書でも必ず正式な敬語を使ってください。カジュアルな日本語は修正してください。": "Always use formal keigo, even in internal documents. Please revise casual Japanese.",
  "正式な日本語に書き直しましたが、今後どちらのルールを使うか分かりません。": "I rewrote it in formal Japanese, but I do not know which rule applies in the future.",
  "月次レポート更新": "Monthly Report Update",
  "レポート案件 J": "Report Project J",
  "不一致なし": "No inconsistency",
  "会議記録とBacklogのテンプレート・納期・成果物が一致しています。追加確認は不要です。": "The template, deadline, and deliverable match across the meeting record and Backlog. No further review is needed.",
  "追加確認は不要です。": "No further review is needed.",
  "8月20日 10:00": "Aug 20, 10:00",
  "8月20日 10:35": "Aug 20, 10:35",
  "レポート責任者": "Report owner",
  "月次レポートは既存テンプレートを使い、金曜日17時までに提出します。": "Use the existing template and submit the monthly report by Friday at 5:00 PM.",
  "既存テンプレートで作成し、金曜日17時までに提出します。": "I will use the existing template and submit by Friday at 5:00 PM.",
  "会議記録": "Meeting log",
  "未確認": "Unreviewed",
  "面談候補": "Follow-up",
  "確認済み": "Reviewed",
  "誤検知": "False positive",
  "外国籍スタッフ関連": "Foreign staff scenario",
  "概要": "Overview",
  "確認キュー": "Review queue",
  "データ登録・検知": "Data & detection",
  "接続設計": "Connection design",
  "実データ・実APIは未接続": "No live data or APIs connected",
  "エンジニアFB反映版": "Engineer-feedback build",
  "自動連携を模した架空データです": "Fictional data with simulated connections",
  "共有理解のズレを、案件単位で見つける。": "Find gaps in shared understanding, issue by issue.",
  "今週の確認キュー": "This week's review queue",
  "読み取り専用パイロット設計": "Read-only pilot design",
  "実データから問題検知までを動かす。": "Run the complete data-to-detection pipeline.",
  "CSV出力": "Export CSV",
  "照合中...": "Analyzing...",
  "架空データで再実行": "Run fictional demo",
  "この画面の案件・メッセージ・数値はすべて架空です。": "Every issue, message, and number on this screen is fictional.",
  "AIは確認候補と根拠を整理するだけです。人や感情を評価せず、最終判断はHRが行います。": "AI only organizes review candidates and evidence. It does not evaluate people or emotions, and HR makes every final decision.",
  "要確認": "Needs review",
  "前週比 +1": "+1 from last week",
  "HRの判断を待っている案件": "Issues awaiting HR review",
  "対象課題": "Issues scanned",
  "限定部署の課題を照合": "Approved department scope",
  "通常範囲": "Within range",
  "自動で非表示": "Hidden by default",
  "不一致が見つからなかった案件": "Issues with no detected mismatch",
  "追加入力": "New staff input",
  "スタッフ負担": "Staff workload",
  "既存記録のみを読み取り": "Uses existing records only",
  "今週、先に見るべき2件": "Two issues to review first",
  "すべて確認 →": "Review all →",
  "手戻り": "Rework",
  "照合した記録": "Records matched",
  "正常": "Ready",
  "課題": "issues",
  "メッセージ": "messages",
  "決定事項": "decisions",
  "最終実行": "Last run",
  "8月25日 09:40": "Aug 25, 09:40",
  "ファイル": "files",
  "デモ接続": "Demo connected",
  "週次HRレポート": "Weekly HR report",
  "優先案件と確認質問をHRにまとめて送ります": "Packages priority cases and review questions for HR",
  "レポートに含める": "Add to report",
  "レポートから外す": "Remove from report",
  "HRへ週次レポートを送信": "Send weekly report to HR",
  "HRへ送信済み": "Sent to HR",
  "通知待ち": "Awaiting notification",
  "件の案件を含む": "cases included",
  "自動収集": "Automatic collection",
  "Chatwork・Backlog・会議記録を読み取り": "Read Chatwork, Backlog, and meeting records",
  "Boxワークスペース": "Box workspace",
  "同じ場所にトランスクリプトと参照IDを集約": "Gather transcripts and reference IDs in one place",
  "30分バッチ分析": "30-minute batch analysis",
  "定義済みシグナルで案件単位に検知": "Detect issue-level signals using defined rules",
  "HRへ通知": "Notify HR",
  "優先案件を週次レポートまたは通知で共有": "Share priority cases through a weekly report or notification",
  "案件IDで集約": "Group by issue ID",
  "人ではなく成果物を軸にする": "Anchor analysis to work, not people",
  "判断履歴を照合": "Compare decision history",
  "変更・矛盾・記録漏れを検知": "Detect changes, conflicts, and gaps",
  "根拠付きで提示": "Show the evidence",
  "元の記録まで必ず戻れる": "Keep every finding traceable",
  "HRが確認": "HR reviews",
  "面談候補または誤検知を記録": "Record follow-up or false positive",
  "すべて": "All",
  "未完了": "Open",
  "対応済み": "Completed",
  "案件単位のみ表示・個人評価なし": "Issue-level view only. No individual evaluation.",
  "案件 / 成果物": "Issue / deliverable",
  "シグナル": "Signal",
  "状態": "Status",
  "信頼度": "Confidence",
  "検知信頼度": "Detection confidence",
  "検知理由": "Why it was flagged",
  "回": "",
  "部署平均": "Department average",
  "判断履歴と根拠": "Decision history and evidence",
  "赤線 = 検知に使った記録": "Red line = evidence used",
  "確認時の質問案": "Suggested review question",
  "出力フォーマット": "Output format",
  "HR専用分析": "Private HR analysis",
  "スタッフ向け確認文": "Staff clarification draft",
  "HR限定": "HR only",
  "HR承認後のみ共有": "Share only after HR approval",
  "スタッフに見せる内容には、HRの内部分析・信頼度・人物評価を含めません。": "The staff-facing output excludes internal HR analysis, confidence scores, and any evaluation of people.",
  "この案件について、異なる指示が記録されています。作業を続ける前に、次の点を確認してください。": "Different instructions were recorded for this work item. Before continuing, please confirm the following point.",
  "これは状況確認のためのメッセージであり、個人の評価ではありません。": "This message requests clarification and is not an evaluation of any individual.",
  "共有をHRが承認": "HR approves sharing",
  "共有承認済み": "Approved for sharing",
  "自動文字起こし": "Automatic transcript",
  "文字起こし信頼度": "Transcript confidence",
  "誤検知として記録": "Mark false positive",
  "面談候補に追加": "Add to follow-up",
  "確認済みにする": "Mark reviewed",
  "今日確認したいのは、AI精度より先に\n「安全に紐づけられるか」です。": "Before AI accuracy, today's key question is:\nCan the records be linked safely?",
  "エンジニアのフィードバックを、収集・分析・通知までの実行フローに反映しました。": "Engineer feedback is now reflected in an operating flow from collection through analysis and notification.",
  "入力ソース": "Input sources",
  "承認済み範囲のChatwork・Backlog・会議記録": "Chatwork, Backlog, and meeting records from the approved scope",
  "自動集約": "Automatic workspace",
  "Boxにトランスクリプト・参照ID・処理状態を集約": "Collect transcripts, reference IDs, and processing status in Box",
  "定義済みアナライザー": "Defined analyzer",
  "矛盾・反復確認・記録漏れ・手戻りを30分ごとに確認": "Check contradictions, repeated clarification, missing records, and rework every 30 minutes",
  "2つの安全な出力": "Two safe outputs",
  "HR専用レポートと、HR承認後のスタッフ確認文": "A private HR report and an HR-approved staff clarification draft",
  "会議フィードバックをV2に反映": "Engineer feedback implemented in V2",
  "検知ワードを単語だけで判断しない": "Do not judge from keywords alone",
  "前後の会話・同一案件・後続質問を組み合わせて判定": "Combine surrounding messages, issue context, and later questions",
  "Boxと各ツールの自動集約を表現": "Show automatic aggregation from each tool into Box",
  "実APIの代わりに読み取り専用デモ接続で動作を再現": "Use read-only demo connections to represent the flow before live APIs",
  "HR用とスタッフ用の出力を分離": "Separate HR and staff outputs",
  "スタッフ向け文面はHR承認後のみ共有可能": "Staff-facing text can be shared only after HR approval",
  "HR不在時は週次レポートで届ける": "Deliver a weekly report when HR cannot attend",
  "優先案件・根拠・確認質問を1つの通知に集約": "Combine priority cases, evidence, and review questions into one notification",
  "処理完了後の通知状態を表示": "Show notification status after processing",
  "30分バッチをデモ実行し、完了からHR通知まで確認可能": "Simulate the 30-minute batch and show completion through HR notification",
  "最初のパイロットは1部署・4週間・読み取り専用を想定。個人スコアは作らず、Backlog課題IDを中心に、Chatworkと会議記録を接続します。": "The initial pilot covers one department for four weeks with read-only access. It creates no individual scores and links Chatwork and meeting records around Backlog issue IDs.",
  "課題ID、状態変更、コメント、担当ロール、更新時刻": "Issue ID, status changes, comments, role, and timestamps",
  "課題IDを含むメッセージ、投稿時刻、スレッド参照": "Messages containing issue IDs, timestamps, and thread references",
  "決定事項、会議日時、関連案件、決定者ロール": "Decisions, meeting time, related issue, and decision-maker role",
  "課題ID・URL・期間から同じ成果物の判断履歴を構成": "Build one decision history from issue IDs, URLs, and time windows",
  "エンジニアに聞きたいこと": "Questions for the engineers",
  "Chatwork内でBacklog課題IDはどの程度使われていますか？": "How consistently are Backlog issue IDs used in Chatwork?",
  "IDがない会話を、どの情報なら安全に同じ案件へ紐づけられそうですか？": "When an ID is missing, what information could safely link a conversation to the same issue?",
  "状態変更と差し戻し回数はAPI履歴から取得できますか？": "Can status changes and return counts be retrieved from API history?",
  "「手戻り」を推測ではなく、どのイベントで定義すべきでしょうか？": "Which events should define rework without relying on inference?",
  "会議記録に案件IDやURLを追加する運用は現実的ですか？": "Would adding an issue ID or URL to meeting records be practical?",
  "追加入力を増やさず、紐づけ精度を上げる方法を確認したいです。": "We want to improve linking accuracy without creating significant extra input.",
  "読み取り専用トークンを部署・期間で制限できますか？": "Can read-only tokens be restricted by department and time period?",
  "4週間の限定パイロットで必要な最小権限を確認したいです。": "We want to identify the minimum permissions required for a four-week pilot.",
  "保存しない設計は可能ですか？": "Can this work without storing source messages?",
  "原文は各システムに残し、Bridge側には参照IDとHR判断だけを保持する案です。": "The proposal keeps source text in each system and stores only reference IDs and HR decisions in Bridge.",
  "最初からしないこと": "What the pilot will not do",
  "社員・管理職のスコアリング": "Score employees or managers",
  "案件と成果物だけを分析単位にする": "Analyze issues and deliverables only",
  "感情・ストレス・性格の推定": "Infer emotion, stress, or personality",
  "業務記録からセンシティブな推測をしない": "Do not infer sensitive traits from work records",
  "自動的な人事判断": "Make automated HR decisions",
  "候補を整理し、HRが必ず原文を確認する": "Organize candidates while HR checks original evidence",
  "全社一括接続": "Connect the entire company at once",
  "承認済みの1部署・4週間から検証する": "Validate with one approved department for four weeks",
  "成功条件": "Success condition",
  "HRが週30分以内で確認でき、実際の手戻り原因を1件以上早期発見できること。": "HR can finish the weekly review in under 30 minutes and identify at least one real source of preventable rework earlier.",
};

function SourceBadge({ source, lang }: { source: Source; lang: Lang }) {
  const meta = sourceMeta[source];
  return <span className={"sourceBadge " + meta.className}><b>{meta.letter}</b>{lang === "en" ? EN[source] || source : source}</span>;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("ja");
  const [view, setView] = useState<View>("overview");
  const [cases, setCases] = useState(INITIAL_CASES);
  const [selectedId, setSelectedId] = useState("BLG-1234");
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState("8月25日 09:40");
  const [detailMode, setDetailMode] = useState<"hr" | "staff">("hr");
  const [reportCaseIds, setReportCaseIds] = useState<string[]>(["BLG-1234", "BLG-1189", "INT-2041"]);
  const [weeklyReportSent, setWeeklyReportSent] = useState(false);
  const [staffDraftApproved, setStaffDraftApproved] = useState<Record<string, boolean>>({});
  const [actionFeedback, setActionFeedback] = useState<{ id: string; kind: "follow-up" | "reviewed" } | null>(null);
  const t = (text: string) => lang === "en" ? EN[text] || text : text;
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => {
    if (!actionFeedback) return;
    const timer = window.setTimeout(() => setActionFeedback(null), 1400);
    return () => window.clearTimeout(timer);
  }, [actionFeedback]);
  const selected = cases.find((item) => item.id === selectedId) || cases[0];
  const reviewCount = cases.filter((item) => item.status === "未確認" || item.status === "面談候補").length;
  const filteredCases = useMemo(() => cases.filter((item) => {
    if (filter === "open") return item.status === "未確認" || item.status === "面談候補";
    if (filter === "done") return item.status === "確認済み" || item.status === "誤検知";
    return true;
  }), [cases, filter]);

  function updateStatus(id: string, status: Status) {
    setCases((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  }
  function confirmStatusAction(id: string, status: "面談候補" | "確認済み") {
    updateStatus(id, status);
    setActionFeedback({ id, kind: status === "面談候補" ? "follow-up" : "reviewed" });
  }
  function toggleReportCase(id: string) {
    setWeeklyReportSent(false);
    setReportCaseIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function sendWeeklyReport() {
    if (!reportCaseIds.length) return;
    setWeeklyReportSent(true);
  }
  function approveStaffDraft(id: string) {
    setStaffDraftApproved((current) => ({ ...current, [id]: true }));
  }
  function runDemo() {
    setRunning(true);
    window.setTimeout(() => {
      setRunning(false);
      setLastRun(new Intl.DateTimeFormat(lang === "en" ? "en-US" : "ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date()));
      setWeeklyReportSent(false);
      setView("review");
    }, 850);
  }
  function exportCsv() {
    const rows: (string | number)[][] = [
      lang === "en"
        ? ["Issue ID", "Deliverable", "Signal", "Rework count", "Department average", "HR status", "Review question"]
        : ["課題ID", "成果物", "検知シグナル", "手戻り回数", "部署平均", "HR確認状況", "面談質問"],
      ...cases.map((item) => [item.id, t(item.title), t(item.signal), item.rework, item.average, t(item.status), t(item.question)]),
    ];
    const csv = "\uFEFF" + rows.map((row) => row.map((cell) => "\"" + String(cell).replaceAll("\"", "\"\"") + "\"").join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "PENCIL_Bridge_Weekly_Review_2026-W35.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="brand"><span className="brandMark">P</span><div><strong>PENCIL <em>V2</em></strong><small>PEOPLE BRIDGE</small></div></div>
        <nav className="mainNav" aria-label={lang === "en" ? "Main navigation" : "メインナビゲーション"}>
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><span>01</span>{t("概要")}</button>
          <button className={view === "pipeline" ? "active" : ""} onClick={() => setView("pipeline")}><span>02</span>{t("データ登録・検知")}</button>
          <button className={view === "review" ? "active" : ""} onClick={() => setView("review")}><span>03</span>{t("確認キュー")}<b>{reviewCount}</b></button>
          <button className={view === "architecture" ? "active" : ""} onClick={() => setView("architecture")}><span>04</span>{t("接続設計")}</button>
        </nav>
        <div className="sidebarFoot"><span className="demoDot" /><div><strong>V2 · ENGINEER FEEDBACK</strong><small>{t("自動連携を模した架空データです")}</small></div></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><span className="eyebrow">PENCIL BRIDGE V2 · HR REVIEW CONSOLE</span><h1>{view === "overview" ? t("共有理解のズレを、案件単位で見つける。") : view === "pipeline" ? t("実データから問題検知までを動かす。") : view === "review" ? t("今週の確認キュー") : t("読み取り専用パイロット設計")}</h1></div>
          <div className="topActions">
            <div className="languageToggle" aria-label="Language">
              <button className={lang === "ja" ? "active" : ""} onClick={() => setLang("ja")}>日本語</button>
              <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
            </div>
            <button className="ghostButton" onClick={exportCsv}>{t("CSV出力")}</button>
            <button className="runButton" onClick={runDemo} disabled={running}>{running ? <><i />{t("照合中...")}</> : t("架空データで再実行")}</button>
          </div>
        </header>

        {view === "pipeline" && <PipelineLab lang={lang} />}
        {view === "overview" && <div className="content overviewView">
          <section className="notice"><div><span>DEMO DATA</span><strong>{t("この画面の案件・メッセージ・数値はすべて架空です。")}</strong></div><p>{t("AIは確認候補と根拠を整理するだけです。人や感情を評価せず、最終判断はHRが行います。")}</p></section>
          <section className="metricGrid">
            <article className="metricCard critical"><div><span>{t("要確認")}</span><small>{t("前週比 +1")}</small></div><strong>{reviewCount}</strong><p>{t("HRの判断を待っている案件")}</p></article>
            <article className="metricCard"><div><span>{t("対象課題")}</span><small>WEEK 35</small></div><strong>10</strong><p>{t("限定部署の課題を照合")}</p></article>
            <article className="metricCard"><div><span>{t("通常範囲")}</span><small>{t("自動で非表示")}</small></div><strong>1</strong><p>{t("不一致が見つからなかった案件")}</p></article>
            <article className="metricCard"><div><span>{t("追加入力")}</span><small>{t("スタッフ負担")}</small></div><strong>0</strong><p>{t("既存記録のみを読み取り")}</p></article>
          </section>
          <section className="overviewGrid">
            <article className="panel signalPanel">
              <header className="panelHeader"><div><span className="eyebrow">WEEKLY SIGNAL</span><h2>{t("今週、先に見るべき2件")}</h2></div><button onClick={() => setView("review")}>{t("すべて確認 →")}</button></header>
              <div className="signalRows">{cases.filter((item) => item.severity !== "normal").slice(0, 2).map((item) => <button key={item.id} onClick={() => { setSelectedId(item.id); setView("review"); }}><span className={"severityBar " + item.severity} /><div className="signalMain"><small>{item.id} ・ {t(item.owner)}</small><strong>{t(item.title)}</strong><p>{t(item.signal)}</p></div><div className="signalStat"><strong>{item.rework}</strong><small>{t("手戻り")}</small></div><span className="rowArrow">→</span></button>)}</div>
            </article>
            <article className="panel sourcePanel">
              <header className="panelHeader"><div><span className="eyebrow">READ-ONLY INPUT</span><h2>{t("照合した記録")}</h2></div><span className="syncState"><i />{t("正常")}</span></header>
              <div className="sourceRows"><div><SourceBadge source="Backlog" lang={lang} /><strong>10</strong><small>{t("課題")}</small></div><div><SourceBadge source="Chatwork" lang={lang} /><strong>15</strong><small>{t("メッセージ")}</small></div><div><SourceBadge source="会議記録" lang={lang} /><strong>9</strong><small>{t("決定事項")}</small></div><div><SourceBadge source="Box" lang={lang} /><strong>40</strong><small>{t("ファイル")}</small></div></div>
              <footer><span>{t("最終実行")}</span><strong>{t(lastRun)}</strong></footer>
            </article>
          </section>
          <section className="weeklyReportPanel">
            <div className="weeklyReportLead"><span className="eyebrow">V2 · HR DELIVERY</span><h2>{t("週次HRレポート")}</h2><p>{t("優先案件と確認質問をHRにまとめて送ります")}</p></div>
            <div className="weeklyReportCases">{reportCaseIds.slice(0, 3).map((id) => { const item = cases.find((entry) => entry.id === id); return item ? <span key={id}><b>{id}</b>{t(item.title)}</span> : null; })}</div>
            <div className="weeklyReportAction"><small className={weeklyReportSent ? "sent" : ""}><i />{weeklyReportSent ? t("HRへ送信済み") : t("通知待ち")}</small><strong>{reportCaseIds.length} {t("件の案件を含む")}</strong><button onClick={sendWeeklyReport} disabled={!reportCaseIds.length || weeklyReportSent}>{weeklyReportSent ? t("HRへ送信済み") : t("HRへ週次レポートを送信")}</button></div>
          </section>
          <section className="workflowStrip"><div><span>1</span><p><strong>{t("自動収集")}</strong><small>{t("Chatwork・Backlog・会議記録を読み取り")}</small></p></div><i>→</i><div><span>2</span><p><strong>{t("Boxワークスペース")}</strong><small>{t("同じ場所にトランスクリプトと参照IDを集約")}</small></p></div><i>→</i><div><span>3</span><p><strong>{t("30分バッチ分析")}</strong><small>{t("定義済みシグナルで案件単位に検知")}</small></p></div><i>→</i><div><span>4</span><p><strong>{t("HRへ通知")}</strong><small>{t("優先案件を週次レポートまたは通知で共有")}</small></p></div></section>
        </div>}

        {view === "review" && <div className="content reviewView">
          <section className="queueToolbar"><div className="segmented"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>{t("すべて")} <b>{cases.length}</b></button><button className={filter === "open" ? "active" : ""} onClick={() => setFilter("open")}>{t("未完了")} <b>{reviewCount}</b></button><button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>{t("対応済み")}</button></div><p><span />{t("案件単位のみ表示・個人評価なし")}</p></section>
          <section className="reviewLayout">
            <div className="caseQueue"><div className="queueColumns"><span>{t("案件 / 成果物")}</span><span>{t("シグナル")}</span><span>{t("状態")}</span></div>{filteredCases.map((item) => <button className={(selected.id === item.id ? "selected " : "") + "severity-" + item.severity} key={item.id} onClick={() => setSelectedId(item.id)}><div><small>{item.id}</small><strong>{t(item.title)}</strong>{item.foreignStaff && <em className="caseForeignBadge">{t("外国籍スタッフ関連")}</em>}<span>{t(item.owner)}</span></div><div><strong>{t(item.signal)}</strong><span>{t("信頼度")} {item.confidence}%</span></div><span className={"statusPill " + statusClass[item.status]}>{t(item.status)}</span></button>)}</div>
            <article className="caseDetail">
              <header className="detailHeader"><div><span className={"statusPill " + statusClass[selected.status]}>{t(selected.status)}</span>{selected.foreignStaff && <span className="caseForeignBadge">{t("外国籍スタッフ関連")}</span>}<small>{selected.id} ・ {t(selected.owner)}</small><h2>{t(selected.title)}</h2></div><div className="confidence"><span>{t("検知信頼度")}</span><strong>{selected.confidence}<small>%</small></strong></div></header>
              <section className="outputModeBar"><div><span className="eyebrow">{t("出力フォーマット")}</span><strong>{detailMode === "hr" ? t("HR限定") : t("HR承認後のみ共有")}</strong></div><div className="segmented"><button className={detailMode === "hr" ? "active" : ""} onClick={() => setDetailMode("hr")}>{t("HR専用分析")}</button><button className={detailMode === "staff" ? "active" : ""} onClick={() => setDetailMode("staff")}>{t("スタッフ向け確認文")}</button></div></section>
              {detailMode === "hr" ? <>
                <section className="findingBox"><span>{t("検知理由")}</span><strong>{t(selected.signal)}</strong><p>{t(selected.summary)}</p><div className="reworkScale"><div><span>{t("手戻り")} <b>{selected.rework}{lang === "ja" ? "回" : ""}</b></span><small>{t("部署平均")} {selected.average.toFixed(1)}{lang === "ja" ? "回" : ""}</small></div><div className="track"><i style={{ width: Math.min(100, selected.rework / 6 * 100) + "%" }} /><b style={{ left: selected.average / 6 * 100 + "%" }} /></div></div></section>
                <section className="evidenceSection"><div className="sectionTitle"><div><span className="eyebrow">SOURCE TRACE</span><h3>{t("判断履歴と根拠")}</h3></div><small>{t("赤線 = 検知に使った記録")}</small></div><div className="timeline">{selected.evidence.map((entry, index) => <div className={entry.flagged ? "flagged" : ""} key={selected.id + "-" + index}><span className="timelineLine" /><SourceBadge source={entry.source} lang={lang} /><small>{t(entry.date)} ・ {t(entry.role)}{entry.source === "会議記録" && <em>{t("自動文字起こし")} · {t("文字起こし信頼度")} 82%</em>}</small><p>{t(entry.text)}</p></div>)}</div></section>
                <section className="questionBox"><div><span>HR</span><small>{t("確認時の質問案")}</small></div><p>{lang === "ja" ? "「" : "“"}{t(selected.question)}{lang === "ja" ? "」" : "”"}</p></section>
                <footer className="detailActions">
                  <button className="textButton" onClick={() => updateStatus(selected.id, "誤検知")}>{t("誤検知として記録")}</button>
                  <div>
                    <button className={reportCaseIds.includes(selected.id) ? "reportButton selected" : "reportButton"} onClick={() => toggleReportCase(selected.id)}>{reportCaseIds.includes(selected.id) ? t("レポートから外す") : t("レポートに含める")}</button>
                    <button
                      className={"outlineButton" + (actionFeedback?.id === selected.id && actionFeedback.kind === "follow-up" ? " actionFeedback" : "")}
                      onClick={() => confirmStatusAction(selected.id, "面談候補")}
                    >
                      {selected.status === "面談候補" ? (lang === "en" ? "✓ Added to follow-up" : "✓ 面談候補に追加済み") : t("面談候補に追加")}
                    </button>
                    <button
                      className={"confirmButton" + (actionFeedback?.id === selected.id && actionFeedback.kind === "reviewed" ? " actionFeedback" : "")}
                      onClick={() => confirmStatusAction(selected.id, "確認済み")}
                    >
                      {selected.status === "確認済み" ? `✓ ${t("確認済み")}` : t("確認済みにする")}
                    </button>
                  </div>
                </footer>
              </> : <>
                <section className="staffDraftPanel"><header><div><span className="eyebrow">STAFF CLARIFICATION</span><h3>{t("スタッフ向け確認文")}</h3></div><span className={staffDraftApproved[selected.id] ? "approved" : "locked"}>{staffDraftApproved[selected.id] ? t("共有承認済み") : t("HR承認後のみ共有")}</span></header><div className="staffDraftBody"><p>{t("この案件について、異なる指示が記録されています。作業を続ける前に、次の点を確認してください。")}</p><blockquote>{t(selected.question)}</blockquote><small>{t("これは状況確認のためのメッセージであり、個人の評価ではありません。")}</small></div><footer>{t("スタッフに見せる内容には、HRの内部分析・信頼度・人物評価を含めません。")}</footer></section>
                <footer className="staffDraftActions"><span>{t("HR承認後のみ共有")}</span><button onClick={() => approveStaffDraft(selected.id)} disabled={Boolean(staffDraftApproved[selected.id])}>{staffDraftApproved[selected.id] ? t("共有承認済み") : t("共有をHRが承認")}</button></footer>
              </>}
            </article>
          </section>
        </div>}

        {view === "architecture" && <div className="content architectureView">
          <section className="architectureIntro"><div><span className="eyebrow">V2 · ENGINEERING FEEDBACK</span><h2>{lang === "en" ? <>From scattered records<br />to an HR notification.</> : <>分散した記録から<br />HRへの通知まで。</>}</h2></div><p>{t("エンジニアのフィードバックを、収集・分析・通知までの実行フローに反映しました。")}</p></section>
          <section className="dataFlow">
            <article><div className="systemCluster"><span className="systemIcon chatwork">C</span><span className="systemIcon backlog">B</span><span className="systemIcon meeting">M</span></div><span>STEP 01</span><strong>{t("入力ソース")}</strong><p>{t("承認済み範囲のChatwork・Backlog・会議記録")}</p><small>{t("デモ接続")}</small></article><i>→</i>
            <article><div className="systemIcon box">X</div><span>STEP 02</span><strong>{t("自動集約")}</strong><p>{t("Boxにトランスクリプト・参照ID・処理状態を集約")}</p><small>WORKSPACE</small></article><i>→</i>
            <article><div className="systemIcon bridge">30</div><span>STEP 03</span><strong>{t("定義済みアナライザー")}</strong><p>{t("矛盾・反復確認・記録漏れ・手戻りを30分ごとに確認")}</p><small>30 MIN BATCH</small></article><i>→</i>
            <article className="bridgeNode"><div className="systemIcon bridge">HR</div><span>STEP 04</span><strong>{t("2つの安全な出力")}</strong><p>{t("HR専用レポートと、HR承認後のスタッフ確認文")}</p><small>HUMAN REVIEW</small></article>
          </section>
          <section className="architectureGrid">
            <article className="panel questionsPanel"><header className="panelHeader"><div><span className="eyebrow">5 CHANGES</span><h2>{t("会議フィードバックをV2に反映")}</h2></div></header><ol>
              <li><span>01</span><p><strong>{t("検知ワードを単語だけで判断しない")}</strong><small>{t("前後の会話・同一案件・後続質問を組み合わせて判定")}</small></p></li>
              <li><span>02</span><p><strong>{t("Boxと各ツールの自動集約を表現")}</strong><small>{t("実APIの代わりに読み取り専用デモ接続で動作を再現")}</small></p></li>
              <li><span>03</span><p><strong>{t("HR用とスタッフ用の出力を分離")}</strong><small>{t("スタッフ向け文面はHR承認後のみ共有可能")}</small></p></li>
              <li><span>04</span><p><strong>{t("HR不在時は週次レポートで届ける")}</strong><small>{t("優先案件・根拠・確認質問を1つの通知に集約")}</small></p></li>
              <li><span>05</span><p><strong>{t("処理完了後の通知状態を表示")}</strong><small>{t("30分バッチをデモ実行し、完了からHR通知まで確認可能")}</small></p></li>
            </ol></article>
            <article className="panel guardrailPanel"><header className="panelHeader"><div><span className="eyebrow">PILOT GUARDRAILS</span><h2>{t("最初からしないこと")}</h2></div></header><ul>
              <li><span>×</span><p><strong>{t("社員・管理職のスコアリング")}</strong><small>{t("案件と成果物だけを分析単位にする")}</small></p></li>
              <li><span>×</span><p><strong>{t("感情・ストレス・性格の推定")}</strong><small>{t("業務記録からセンシティブな推測をしない")}</small></p></li>
              <li><span>×</span><p><strong>{t("自動的な人事判断")}</strong><small>{t("候補を整理し、HRが必ず原文を確認する")}</small></p></li>
              <li><span>×</span><p><strong>{t("全社一括接続")}</strong><small>{t("承認済みの1部署・4週間から検証する")}</small></p></li>
            </ul><footer><strong>{t("成功条件")}</strong><p>{t("HRが週30分以内で確認でき、実際の手戻り原因を1件以上早期発見できること。")}</p></footer></article>
          </section>
        </div>}
      </section>
    </main>
  );
}
