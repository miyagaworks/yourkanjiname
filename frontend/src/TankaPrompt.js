import React, { useState } from 'react';
import './TankaPrompt.css';

function TankaPrompt() {
  // Step 1 state
  const [step1Input, setStep1Input] = useState('');
  const [step1Output, setStep1Output] = useState('');
  const [step1Copied, setStep1Copied] = useState(false);

  // Step 2 state
  const [step2Initials, setStep2Initials] = useState('');
  const [step2Image, setStep2Image] = useState('');
  const [step2Output, setStep2Output] = useState('');
  const [step2Copied, setStep2Copied] = useState(false);

  // Step 3 state
  const [step3Tanka, setStep3Tanka] = useState('');
  const [step3Explanation, setStep3Explanation] = useState('');
  const [step3Name, setStep3Name] = useState('');
  const [step3Initials, setStep3Initials] = useState('');
  const [step3Language, setStep3Language] = useState('English');
  const [step3Output, setStep3Output] = useState('');
  const [step3Copied, setStep3Copied] = useState(false);

  // Step 1: Generate character summary prompt
  const generateStep1Prompt = () => {
    if (!step1Input.trim()) {
      alert('説明文を入力してください');
      return;
    }

    const prompt = `以下は、ある人物の性格分析に基づいて選ばれた漢字名の説明文です。
この説明文を読み、その人物がどのような人かを日本語で端的に要約してください。

要約のポイント：
- 性格の核となる特徴
- その人の強みや美点
- 情景が浮かぶような表現

出力形式：
1〜2文で簡潔に（短歌を詠む際の人物イメージとして使用）

説明文：
${step1Input.trim()}`;

    setStep1Output(prompt);
  };

  // Step 2: Generate tanka creation prompt
  const generateStep2Prompt = () => {
    if (!step2Initials.trim()) {
      alert('頭文字を入力してください');
      return;
    }
    if (!step2Image.trim()) {
      alert('短歌作成イメージを入力してください');
      return;
    }

    const prompt = `以下の条件で短歌を作成してください:

【頭文字】: ${step2Initials.trim()}

【条件】

1. 五七五七七の短歌形式にすること
1. 各句の最初の文字を繋げると、指定した【頭文字】になること
1. 短歌として意味が通り、美しい表現になること
1. 漢字を含めた語句と括弧内には読み仮名を追加
1. 季語や情景描写を含めると良い

【例】
頭文字: ありがとう
↓
朝焼けに（あさやけに）
りんごの花が（りんごのはなが）
ガラス越し（がらすごし）
遠くに見えたり（とおくみえたり）
嬉しき限り（うれしきかぎり）

短歌作成イメージ：
${step2Image.trim()}`;

    setStep2Output(prompt);
  };

  // Step 3: Generate translation prompt
  const generateStep3Prompt = () => {
    if (!step3Tanka.trim()) {
      alert('短歌を入力してください');
      return;
    }
    if (!step3Explanation.trim()) {
      alert('解説を入力してください');
      return;
    }
    if (!step3Name.trim()) {
      alert('名前を入力してください');
      return;
    }
    if (!step3Initials.trim()) {
      alert('名前のひらがな頭文字を入力してください');
      return;
    }

    const prompt = `以下の短歌とその解説を、メールで送信する「折句説明文」として整形し、指定された言語に正確に翻訳してください。

【短歌】
${step3Tanka.trim()}

【解説】
${step3Explanation.trim()}

【名前のローマ字】
${step3Name.trim()}

【名前のひらがな頭文字】
${step3Initials.trim()}

【翻訳する言語】
${step3Language}

【重要な出力ルール】
- アーティファクトにプレーンテキストのみで出力
- 表、マークダウン、装飾は一切使用しない
- そのままコピペしてメール本文に貼り付けられる形式で
- タイトルや見出しの記号（#、**など）は使わない
- 改行と空行のみで構成する

---
期待する出力例（日本語）

このたび、あなたのお名前を織り込んだ短歌を詠みました。
日本の伝統的な詩の形式である「折句（おりく）」という技法を用いて、五つの句の頭文字にあなたのお名前が隠されています。

お名前: Ryohei → ひらがなで「りょうへい」

凛と立つ（り）
夜明けの峰は（よ）
動かざり（う）
平和を守り（へ）
命を照らす（い）

夜明けの光を受けて凛と聳える峰のように、どんな嵐が来ても決して動じることなく、揺るぎなく立ち続ける。人々の平和を静かに守り、その命をあたたかく照らし、導いていく——そんな慈愛と強さを兼ね備えた存在を詠んだ歌です。

この短歌が、あなたの人生に寄り添う小さな贈り物となれば幸いです。`;

    setStep3Output(prompt);
  };

  // Copy to clipboard
  const copyToClipboard = async (text, setCopied) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('コピーに失敗しました');
    }
  };

  const languages = [
    '日本語',
    'English',
    'Français',
    'Deutsch',
    'Español',
    'Português',
    'Italiano',
    'ไทย',
    'Tiếng Việt',
    'Bahasa Indonesia',
    '한국어'
  ];

  return (
    <div className="tanka-prompt">
      <header className="tanka-header">
        <h1>短歌プロンプト生成ツール</h1>
      </header>

      <main className="tanka-content">
        {/* Step 1 */}
        <section className="tanka-step">
          <h2>Step 1: 人物イメージ要約</h2>
          <p className="step-description">漢字命名の説明文から、短歌作成用の人物イメージを生成するプロンプトを作成します。</p>

          <div className="input-group">
            <label>説明文</label>
            <textarea
              value={step1Input}
              onChange={(e) => setStep1Input(e.target.value)}
              placeholder="漢字命名の説明文をペーストしてください..."
              rows={6}
            />
          </div>

          <button onClick={generateStep1Prompt} className="generate-btn">
            プロンプト生成
          </button>

          {step1Output && (
            <div className="output-group">
              <div className="output-header">
                <label>生成されたプロンプト</label>
                <button
                  onClick={() => copyToClipboard(step1Output, setStep1Copied)}
                  className="copy-btn"
                >
                  {step1Copied ? 'コピーしました!' : 'コピー'}
                </button>
              </div>
              <pre className="output-text">{step1Output}</pre>
            </div>
          )}
        </section>

        {/* Step 2 */}
        <section className="tanka-step">
          <h2>Step 2: 短歌作成</h2>
          <p className="step-description">頭文字（折句）を使った短歌を作成するプロンプトを生成します。</p>

          <div className="input-group">
            <label>頭文字（ひらがな5文字）</label>
            <input
              type="text"
              value={step2Initials}
              onChange={(e) => setStep2Initials(e.target.value)}
              placeholder="例: りょうへい"
            />
          </div>

          <div className="input-group">
            <label>短歌作成イメージ</label>
            <textarea
              value={step2Image}
              onChange={(e) => setStep2Image(e.target.value)}
              placeholder="Step 1で生成した人物イメージをペーストしてください..."
              rows={4}
            />
          </div>

          <button onClick={generateStep2Prompt} className="generate-btn">
            プロンプト生成
          </button>

          {step2Output && (
            <div className="output-group">
              <div className="output-header">
                <label>生成されたプロンプト</label>
                <button
                  onClick={() => copyToClipboard(step2Output, setStep2Copied)}
                  className="copy-btn"
                >
                  {step2Copied ? 'コピーしました!' : 'コピー'}
                </button>
              </div>
              <pre className="output-text">{step2Output}</pre>
            </div>
          )}
        </section>

        {/* Step 3 */}
        <section className="tanka-step">
          <h2>Step 3: 折句説明文の翻訳</h2>
          <p className="step-description">短歌と解説をメール送信用の折句説明文に整形・翻訳するプロンプトを生成します。</p>

          <div className="input-group">
            <label>短歌</label>
            <textarea
              value={step3Tanka}
              onChange={(e) => setStep3Tanka(e.target.value)}
              placeholder="生成された短歌をペーストしてください..."
              rows={5}
            />
          </div>

          <div className="input-group">
            <label>解説</label>
            <textarea
              value={step3Explanation}
              onChange={(e) => setStep3Explanation(e.target.value)}
              placeholder="短歌の解説をペーストしてください..."
              rows={4}
            />
          </div>

          <div className="input-row">
            <div className="input-group half">
              <label>名前（ローマ字）</label>
              <input
                type="text"
                value={step3Name}
                onChange={(e) => setStep3Name(e.target.value)}
                placeholder="例: Ryohei"
              />
            </div>

            <div className="input-group half">
              <label>名前のひらがな頭文字</label>
              <input
                type="text"
                value={step3Initials}
                onChange={(e) => setStep3Initials(e.target.value)}
                placeholder="例: り・ょ・う・へ・い"
              />
            </div>
          </div>

          <div className="input-group">
            <label>翻訳する言語</label>
            <select
              value={step3Language}
              onChange={(e) => setStep3Language(e.target.value)}
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <button onClick={generateStep3Prompt} className="generate-btn">
            プロンプト生成
          </button>

          {step3Output && (
            <div className="output-group">
              <div className="output-header">
                <label>生成されたプロンプト</label>
                <button
                  onClick={() => copyToClipboard(step3Output, setStep3Copied)}
                  className="copy-btn"
                >
                  {step3Copied ? 'コピーしました!' : 'コピー'}
                </button>
              </div>
              <pre className="output-text">{step3Output}</pre>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default TankaPrompt;
