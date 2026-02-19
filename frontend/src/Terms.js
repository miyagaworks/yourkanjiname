import React, { useEffect } from 'react';
import './Terms.css';

const Terms = ({ onBack, language = 'en' }) => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const content = {
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last Updated: January 2026',
      sections: [
        {
          title: '1. Service Description',
          content: `Your Kanji Name is a service that creates personalized Japanese kanji names for customers based on their preferences and personality. The service includes:

• Personalized kanji name creation based on your question responses
• Professional calligraphy artwork of your kanji name
• Explanation of the meaning and significance of your name
• Digital delivery of the calligraphy image via email`
        },
        {
          title: '2. Pricing and Payment',
          content: `• Service fees are as displayed at the time of purchase
• Payment is processed securely through Stripe
• Payment is required before starting the name generation process
• All prices are final and include the complete service package`
        },
        {
          title: '3. What You Receive',
          content: `After answering the questions, you will receive:

• A unique kanji name created specifically for you
• Explanation of the meaning in your selected language
• Within one week, a handwritten calligraphy image sent to your email address
• The calligraphy is created by a professional Japanese calligrapher`
        },
        {
          title: '4. Refund Policy',
          content: `• Due to the personalized nature of this service, refunds are generally not available once the name generation process has begun
• If you experience technical issues preventing service delivery, please contact us for assistance
• Refund requests will be evaluated on a case-by-case basis`
        },
        {
          title: '5. Intellectual Property',
          content: `• There are no intellectual property restrictions on the kanji name or calligraphy created for you
• The calligraphy image we deliver is yours to use freely for any purpose, including personal and commercial use
• No credit or attribution is required`
        },
        {
          title: '6. Privacy',
          content: `• We collect your email address to deliver your calligraphy
• Your question responses are used solely to create your personalized name
• We do not sell or share your personal information with third parties
• Payment information is processed securely by Stripe and not stored on our servers`
        },
        {
          title: '7. Disclaimer',
          content: `• Kanji names are created based on artistic interpretation and cultural knowledge
• The meanings provided are based on traditional Japanese character meanings
• We strive for accuracy but cannot guarantee specific interpretations
• This service is for entertainment and cultural appreciation purposes`
        },
        {
          title: '8. Contact',
          content: `For questions or concerns about our service, please contact us at:

contact@kanjiname.jp`
        }
      ],
      backButton: 'Back'
    },
    ja: {
      title: '利用規約',
      lastUpdated: '最終更新日: 2026年1月',
      sections: [
        {
          title: '1. サービス内容',
          content: `Your Kanji Nameは、お客様のご希望や個性に基づいて、オリジナルの漢字名を作成するサービスです。サービスには以下が含まれます：

• 質問回答に基づくオリジナル漢字名の作成
• プロの書道家による書道作品
• お名前の意味と由来の説明
• 書道画像のメール配信`
        },
        {
          title: '2. 料金とお支払い',
          content: `• サービス料金はお申し込み時に表示される金額となります
• 決済はStripeを通じて安全に処理されます
• お名前生成を開始する前にお支払いが必要です
• 表示価格にはサービス一式が含まれています`
        },
        {
          title: '3. お届けするもの',
          content: `質問回答後、以下をお届けします：

• お客様専用に作成されたオリジナル漢字名
• 選択された言語での意味の説明
• 1週間以内に、手書きの書道画像をメールでお届け
• 書道は日本のプロ書道家が制作します`
        },
        {
          title: '4. 返金ポリシー',
          content: `• 本サービスはお客様専用にカスタマイズされるため、名前生成プロセス開始後の返金は原則としてお受けできません
• 技術的な問題でサービスが提供できない場合は、お問い合わせください
• 返金リクエストは個別に検討いたします`
        },
        {
          title: '5. 知的財産権',
          content: `• 作成された漢字名および筆文字に関する知的財産権の制限は特にありません
• お送りした筆文字はご自由にお使いください（個人利用・商用利用を問いません）
• クレジット表記等も不要です`
        },
        {
          title: '6. プライバシー',
          content: `• 書道をお届けするためにメールアドレスを収集します
• 質問回答はお名前作成のみに使用されます
• 個人情報を第三者に販売・共有することはありません
• 決済情報はStripeが安全に処理し、当社サーバーには保存されません`
        },
        {
          title: '7. 免責事項',
          content: `• 漢字名は芸術的解釈と文化的知識に基づいて作成されます
• 提供される意味は伝統的な日本の漢字の意味に基づいています
• 正確性に努めますが、特定の解釈を保証するものではありません
• 本サービスはエンターテインメントおよび文化理解を目的としています`
        },
        {
          title: '8. お問い合わせ',
          content: `サービスに関するご質問やご懸念は、下記までお問い合わせください。

contact@kanjiname.jp`
        }
      ],
      backButton: '戻る'
    }
  };

  const t = content[language] || content.en;

  return (
    <div className="terms-container">
      <div className="terms-content">
        <h1>{t.title}</h1>
        <p className="terms-updated">{t.lastUpdated}</p>

        {t.sections.map((section, index) => (
          <div key={index} className="terms-section">
            <h2>{section.title}</h2>
            <p>{section.content}</p>
          </div>
        ))}

        {onBack && (
          <button className="terms-back-btn" onClick={onBack}>
            {t.backButton}
          </button>
        )}
      </div>
    </div>
  );
};

export default Terms;
